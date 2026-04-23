import random
import string
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import OrderAuditLog
from app.models.order import Order, OrderItem
from app.models.order_serial_counter import OrderSerialCounter
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.email_service import send_order_confirmation
from app.services.pricing_service import calc_order_total, calc_total, calc_unit_price, get_pricing_config


# ── Customer Code & Order Number ───────────────────────────────────────────────

async def assign_customer_code(db: AsyncSession, user: User) -> str:
    """Lazily assign a unique 3-char alphanumeric code to a user on their first order."""
    if user.customer_code:
        return user.customer_code
    while True:
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=3))
        existing = await db.execute(select(User).where(User.customer_code == code))
        if not existing.scalar_one_or_none():
            user.customer_code = code
            await db.flush()
            return code


async def generate_order_number(db: AsyncSession, customer_code: str) -> str:
    """Atomically increment the per-customer serial counter and return formatted order number."""
    result = await db.execute(
        select(OrderSerialCounter)
        .where(OrderSerialCounter.customer_code == customer_code)
        .with_for_update()
    )
    counter = result.scalar_one_or_none()
    if counter is None:
        counter = OrderSerialCounter(customer_code=customer_code, last_serial=0)
        db.add(counter)
    counter.last_serial += 1
    await db.flush()
    return f"{customer_code}-{counter.last_serial:06d}"


# ── Audit Log ──────────────────────────────────────────────────────────────────

async def write_audit_log(
    db: AsyncSession,
    order_id: str,
    user: User | None,
    old_status: str | None,
    new_status: str,
    note: str | None = None,
) -> None:
    """Append an immutable audit log entry for a status transition."""
    entry = OrderAuditLog(
        id=str(uuid.uuid4()),
        order_id=order_id,
        changed_by=user.id if user else None,
        changed_by_role=getattr(user, "role", None) if user else None,
        old_status=old_status,
        new_status=new_status,
        note=note,
    )
    db.add(entry)
    await db.flush()


# ── Create Order ───────────────────────────────────────────────────────────────

async def create_order(db: AsyncSession, user_id: str, data: OrderCreate) -> Order:
    # Resolve user to assign customer code + generate order number
    user_result = await db.execute(select(User).where(User.id == user_id).with_for_update())
    user = user_result.scalar_one()

    customer_code = await assign_customer_code(db, user)
    order_number = await generate_order_number(db, customer_code)

    # Server-side price calculation for each item
    items: list[OrderItem] = []
    subtotal = Decimal("0")
    total_cards = 0

    config = await get_pricing_config(db)

    for item_data in data.items:
        unit_price = calc_unit_price(
            item_data.printer, item_data.finish, item_data.chip_type, item_data.print_side, config
        )
        total_price = calc_total(unit_price, item_data.quantity, config)
        subtotal += total_price
        total_cards += item_data.quantity

        items.append(
            OrderItem(
                design_id=item_data.design_id,
                card_type=item_data.card_type,
                printer=item_data.printer,
                print_side=item_data.print_side,
                orientation=item_data.orientation,
                chip_type=item_data.chip_type,
                finish=item_data.finish,
                material=item_data.material,
                quantity=item_data.quantity,
                unit_price=float(unit_price),
                total_price=float(total_price),
                front_field_count=item_data.front_field_count,
                back_field_count=item_data.back_field_count,
            )
        )

    # Calculate order totals
    totals = calc_order_total(subtotal, data.shipping_method, config=config)

    order = Order(
        order_number=order_number,
        user_id=user_id,
        status="CONFIRM",
        shipping_address=data.shipping.model_dump(),
        shipping_method=data.shipping_method,
        shipping_cost=totals["shipping_cost"],
        payment_method=data.payment_method,
        subtotal=totals["subtotal"],
        promo_discount=totals["promo_discount"],
        tax=totals["tax"],
        grand_total=totals["grand_total"],
        total_cards=total_cards,
        items=items,
    )

    db.add(order)
    await db.flush()

    # Write initial audit log entry
    await write_audit_log(db, order.id, user, old_status=None, new_status="CONFIRM", note="Order placed")

    # Send confirmation email — never blocks order creation if email fails
    recipient_email = data.shipping.email
    recipient_name = f"{data.shipping.first_name} {data.shipping.last_name}".strip()
    try:
        await send_order_confirmation(order, recipient_email, recipient_name)
    except Exception:
        pass  # email_service already logs the error

    return order
