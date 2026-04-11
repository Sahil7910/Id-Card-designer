from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, Query, UploadFile, status
from fastapi import File as FastAPIFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.image_service import save_image
from app.dependencies import get_current_admin
from app.models.card_option import CardOption
from app.models.order import Order, OrderItem
from app.models.card_option import CardOption
from app.models.pricing_config import PricingConfig
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateUpdate

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────


class PricingConfigResponse(BaseModel):
    key: str
    value: float
    label: str
    updated_at: datetime | None

    class Config:
        from_attributes = True


class PricingConfigUpdate(BaseModel):
    value: float


class CardOptionCreate(BaseModel):
    category: str
    value: str
    label: str
    price_addon: float = 0.0
    is_active: bool = True
    sort_order: int = 0


class CardOptionUpdate(BaseModel):
    value: str | None = None
    label: str | None = None
    price_addon: float | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class CardOptionResponse(BaseModel):
    id: str
    category: str
    value: str
    label: str
    price_addon: float
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class AdminUserResponse(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    company: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime | None

    class Config:
        from_attributes = True


class AdminOrderItemResponse(BaseModel):
    id: str
    card_type: str
    printer: str
    finish: str
    chip_type: str
    material: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True


class AdminOrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    grand_total: float
    total_cards: int
    payment_method: str
    shipping_method: str
    created_at: datetime | None
    customer_email: str | None = None
    customer_name: str | None = None
    items: list[AdminOrderItemResponse]

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_orders: int
    total_revenue: float
    total_users: int
    active_templates: int
    orders_by_status: dict[str, int]
    revenue_last_30_days: float
    orders_last_30_days: int
    top_finishes: list[dict]
    top_chip_types: list[dict]
    top_materials: list[dict]
    recent_orders: list[AdminOrderResponse]


# ── Analytics ──────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Total orders & revenue
    order_result = await db.execute(select(func.count(Order.id), func.coalesce(func.sum(Order.grand_total), 0)))
    total_orders, total_revenue = order_result.one()

    # Total users
    user_result = await db.execute(select(func.count(User.id)))
    total_users = user_result.scalar_one()

    # Active templates
    tmpl_result = await db.execute(select(func.count(Template.id)).where(Template.is_active == True))
    active_templates = tmpl_result.scalar_one()

    # Orders by status
    status_result = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    orders_by_status = {row[0]: row[1] for row in status_result.all()}

    # Last 30 days
    thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    last30_result = await db.execute(
        select(func.count(Order.id), func.coalesce(func.sum(Order.grand_total), 0))
        .where(Order.created_at >= thirty_days_ago)
    )
    orders_last_30, revenue_last_30 = last30_result.one()

    # Top finishes
    finish_result = await db.execute(
        select(OrderItem.finish, func.count(OrderItem.id).label("cnt"))
        .group_by(OrderItem.finish)
        .order_by(func.count(OrderItem.id).desc())
        .limit(5)
    )
    top_finishes = [{"value": r[0], "count": r[1]} for r in finish_result.all()]

    # Top chip types
    chip_result = await db.execute(
        select(OrderItem.chip_type, func.count(OrderItem.id).label("cnt"))
        .group_by(OrderItem.chip_type)
        .order_by(func.count(OrderItem.id).desc())
        .limit(5)
    )
    top_chip_types = [{"value": r[0], "count": r[1]} for r in chip_result.all()]

    # Top materials
    mat_result = await db.execute(
        select(OrderItem.material, func.count(OrderItem.id).label("cnt"))
        .group_by(OrderItem.material)
        .order_by(func.count(OrderItem.id).desc())
        .limit(5)
    )
    top_materials = [{"value": r[0], "count": r[1]} for r in mat_result.all()]

    # Recent orders (last 10) with user info
    recent_result = await db.execute(
        select(Order, User)
        .join(User, Order.user_id == User.id)
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_rows = recent_result.all()
    recent_orders = []
    for order, user in recent_rows:
        recent_orders.append(AdminOrderResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            grand_total=float(order.grand_total),
            total_cards=order.total_cards,
            payment_method=order.payment_method,
            shipping_method=order.shipping_method,
            created_at=order.created_at,
            customer_email=user.email,
            customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() or None,
            items=[AdminOrderItemResponse(
                id=item.id,
                card_type=item.card_type,
                printer=item.printer,
                finish=item.finish,
                chip_type=item.chip_type,
                material=item.material,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                total_price=float(item.total_price),
            ) for item in order.items],
        ))

    return StatsResponse(
        total_orders=total_orders,
        total_revenue=float(total_revenue),
        total_users=total_users,
        active_templates=active_templates,
        orders_by_status=orders_by_status,
        revenue_last_30_days=float(revenue_last_30),
        orders_last_30_days=orders_last_30,
        top_finishes=top_finishes,
        top_chip_types=top_chip_types,
        top_materials=top_materials,
        recent_orders=recent_orders,
    )


# ── Orders ─────────────────────────────────────────────────────────────────────


@router.get("/orders", response_model=list[AdminOrderResponse])
async def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order, User).join(User, Order.user_id == User.id)

    if status_filter:
        query = query.where(Order.status == status_filter)

    if search:
        query = query.where(
            Order.order_number.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    query = query.order_by(Order.created_at.desc())
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    rows = result.all()

    orders = []
    for order, user in rows:
        orders.append(AdminOrderResponse(
            id=order.id,
            order_number=order.order_number,
            status=order.status,
            grand_total=float(order.grand_total),
            total_cards=order.total_cards,
            payment_method=order.payment_method,
            shipping_method=order.shipping_method,
            created_at=order.created_at,
            customer_email=user.email,
            customer_name=f"{user.first_name or ''} {user.last_name or ''}".strip() or None,
            items=[AdminOrderItemResponse(
                id=item.id,
                card_type=item.card_type,
                printer=item.printer,
                finish=item.finish,
                chip_type=item.chip_type,
                material=item.material,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                total_price=float(item.total_price),
            ) for item in order.items],
        ))
    return orders


# ── Pricing Config ─────────────────────────────────────────────────────────────


@router.get("/pricing", response_model=list[PricingConfigResponse])
async def get_pricing(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PricingConfig).order_by(PricingConfig.key))
    return result.scalars().all()


@router.put("/pricing/{key}", response_model=PricingConfigResponse)
async def update_pricing(
    key: str,
    data: PricingConfigUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PricingConfig).where(PricingConfig.key == key))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing key not found")
    config.value = float(data.value)

    # Keep card_options.price_addon in sync for chip types so the designer shows the updated price
    CHIP_KEY_TO_VALUE = {"addon_rfid": "RFID", "addon_led": "LED"}
    if key in CHIP_KEY_TO_VALUE:
        co_result = await db.execute(
            select(CardOption).where(
                CardOption.category == "chip_type",
                CardOption.value == CHIP_KEY_TO_VALUE[key],
            )
        )
        card_opt = co_result.scalar_one_or_none()
        if card_opt:
            card_opt.price_addon = float(data.value)

    await db.flush()
    await db.refresh(config)
    return config


# ── Card Options ───────────────────────────────────────────────────────────────


@router.get("/card-options", response_model=list[CardOptionResponse])
async def list_card_options(
    category: str | None = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(CardOption).order_by(CardOption.category, CardOption.sort_order)
    if category:
        query = query.where(CardOption.category == category)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/card-options", response_model=CardOptionResponse, status_code=status.HTTP_201_CREATED)
async def create_card_option(
    data: CardOptionCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    option = CardOption(
        category=data.category,
        value=data.value,
        label=data.label,
        price_addon=data.price_addon,
        is_active=data.is_active,
        sort_order=data.sort_order,
    )
    db.add(option)
    await db.flush()
    return option


@router.put("/card-options/{option_id}", response_model=CardOptionResponse)
async def update_card_option(
    option_id: str,
    data: CardOptionUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CardOption).where(CardOption.id == option_id))
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card option not found")

    if data.value is not None:
        option.value = data.value
    if data.label is not None:
        option.label = data.label
    if data.price_addon is not None:
        option.price_addon = data.price_addon
    if data.is_active is not None:
        option.is_active = data.is_active
    if data.sort_order is not None:
        option.sort_order = data.sort_order

    await db.flush()
    return option


@router.delete("/card-options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card_option(
    option_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CardOption).where(CardOption.id == option_id))
    option = result.scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card option not found")
    await db.delete(option)
    await db.flush()


# ── Users ──────────────────────────────────────────────────────────────────────


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * per_page
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(per_page)
    )
    return result.scalars().all()


# ── Templates ──────────────────────────────────────────────────────────────────


@router.get("/templates", response_model=list[TemplateResponse])
async def list_all_templates(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).order_by(Template.created_at.desc()))
    return result.scalars().all()


@router.post("/templates", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    data: TemplateCreate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    template = Template(
        name=data.name,
        category=data.category,
        accent_color=data.accent_color,
        bg_color=data.bg_color,
        front_fields=data.front_fields,
        back_fields=data.back_fields,
        front_bg_url=data.front_bg_url,
        back_bg_url=data.back_bg_url,
        orientation=data.orientation,
    )
    db.add(template)
    await db.flush()
    return template


@router.post("/templates/upload", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template_with_images(
    name: str = Form(...),
    category: str | None = Form(None),
    accent_color: str | None = Form(None),
    bg_color: str | None = Form(None),
    orientation: str = Form("Horizontal"),
    front_image: UploadFile = FastAPIFile(...),
    back_image: UploadFile | None = FastAPIFile(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    front_bg_url = await save_image(front_image)
    back_bg_url = await save_image(back_image) if back_image and back_image.filename else None

    template = Template(
        name=name,
        category=category,
        accent_color=accent_color,
        bg_color=bg_color,
        front_fields=[],
        back_fields=[],
        front_bg_url=front_bg_url,
        back_bg_url=back_bg_url,
        orientation=orientation,
    )
    db.add(template)
    await db.flush()
    await db.refresh(template)
    return template


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    data: TemplateUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if data.name is not None:
        template.name = data.name
    if data.category is not None:
        template.category = data.category
    if data.accent_color is not None:
        template.accent_color = data.accent_color
    if data.bg_color is not None:
        template.bg_color = data.bg_color
    if data.front_fields is not None:
        template.front_fields = data.front_fields
    if data.back_fields is not None:
        template.back_fields = data.back_fields
    if data.front_bg_url is not None:
        template.front_bg_url = data.front_bg_url
    if data.back_bg_url is not None:
        template.back_bg_url = data.back_bg_url
    if data.orientation is not None:
        template.orientation = data.orientation
    if data.is_active is not None:
        template.is_active = data.is_active
    await db.flush()
    await db.refresh(template)
    return template


@router.patch("/templates/{template_id}/toggle", response_model=dict)
async def toggle_template(
    template_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    template.is_active = not template.is_active
    await db.flush()
    return {"id": template.id, "is_active": template.is_active}


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await db.delete(template)
    await db.flush()
