from fastapi import APIRouter, Depends

from app.database import get_db
from app.models.card_option import CardOption
from app.models.pricing_config import PricingConfig
from app.schemas.pricing import PricingRequest, PricingResponse
from app.services.pricing_service import calc_total, calc_unit_price, get_discount_label, get_pricing_config
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/calculate", response_model=PricingResponse)
async def calculate_price(data: PricingRequest, db: AsyncSession = Depends(get_db)):
    config = await get_pricing_config(db)
    unit_price = calc_unit_price(data.printer, data.finish, data.chip_type, data.print_side, config)
    total_price = calc_total(unit_price, data.quantity, config)
    discount_label = get_discount_label(data.quantity, config)

    return PricingResponse(
        unit_price=float(unit_price),
        total_price=float(total_price),
        discount_label=discount_label,
        quantity=data.quantity,
    )


@router.get("/config")
async def get_public_pricing_config(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all pricing config values as a flat dict."""
    config = await get_pricing_config(db)
    return config


@router.get("/card-options")
async def get_public_card_options(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns active card options grouped by category."""
    result = await db.execute(
        select(CardOption)
        .where(CardOption.is_active == True)
        .order_by(CardOption.category, CardOption.sort_order)
    )
    options = result.scalars().all()

    grouped: dict[str, list[dict]] = {}
    for opt in options:
        cat = opt.category
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append({
            "value": opt.value,
            "label": opt.label,
            "price_addon": float(opt.price_addon),
        })
    return grouped
