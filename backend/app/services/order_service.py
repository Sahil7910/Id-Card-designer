import secrets
import string
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.services.email_service import send_order_confirmation
from app.services.pricing_service import calc_order_total, calc_total, calc_unit_price, get_pricing_config


def generate_order_number() -> str:
    chars = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(chars) for _ in range(6))
    return f"ORD-{random_part}"


async def create_order(db: AsyncSession, user_id: str, data: OrderCreate) -> Order:
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
        order_number=generate_order_number(),
        user_id=user_id,
        status="pending" if data.payment_method == "cod" else "confirmed",
        payment_ref=data.razorpay_payment_id if data.payment_method != "cod" else None,
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

    # Send confirmation email — never blocks order creation if email fails
    recipient_email = data.shipping.email
    recipient_name = f"{data.shipping.first_name} {data.shipping.last_name}".strip()
    try:
        await send_order_confirmation(order, recipient_email, recipient_name)
    except Exception:
        pass  # email_service already logs the error

    return order
