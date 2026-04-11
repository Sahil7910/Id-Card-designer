from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pricing_config import PricingConfig

# ── Default hardcoded config (used as fallback / seed values) ─────────────────

DEFAULT_PRICING: dict[str, tuple[float, str]] = {
    "base_thermal":       (2.50, "Base price — Thermal printer"),
    "base_inkjet":        (1.20, "Base price — Inkjet printer"),
    "addon_glossy":       (0.30, "Add-on — Glossy finish"),
    "addon_metallic":     (0.80, "Add-on — Metallic finish"),
    "addon_rfid":         (1.50, "Add-on — RFID chip"),
    "addon_led":          (2.00, "Add-on — LED chip"),
    "addon_both_sides":   (0.40, "Add-on — Both sides printing"),
    "discount_50":        (7.0,  "Discount % for qty ≥ 50"),
    "discount_100":       (12.0, "Discount % for qty ≥ 100"),
    "discount_200":       (18.0, "Discount % for qty ≥ 200"),
    "discount_500":       (25.0, "Discount % for qty ≥ 500"),
    "shipping_standard":  (0.0,  "Shipping — Standard (5–7 days)"),
    "shipping_express":   (9.99, "Shipping — Express (2–3 days)"),
    "shipping_overnight": (24.99,"Shipping — Overnight (1 day)"),
}


def _defaults_as_dict() -> dict[str, float]:
    return {k: v for k, (v, _) in DEFAULT_PRICING.items()}


async def get_pricing_config(db: AsyncSession) -> dict[str, float]:
    """Load pricing from DB; fall back to defaults for any missing keys."""
    result = await db.execute(select(PricingConfig))
    rows = result.scalars().all()
    config = _defaults_as_dict()
    for row in rows:
        config[row.key] = float(row.value)
    return config


async def seed_pricing_config(db: AsyncSession) -> None:
    """Insert default pricing rows if not already present."""
    result = await db.execute(select(PricingConfig))
    existing_keys = {row.key for row in result.scalars().all()}
    for key, (value, label) in DEFAULT_PRICING.items():
        if key not in existing_keys:
            db.add(PricingConfig(key=key, value=value, label=label))
    await db.flush()


# ── Pricing calculation ───────────────────────────────────────────────────────


def calc_unit_price(
    printer: str,
    finish: str,
    chip_type: str,
    print_side: str,
    config: dict[str, float] | None = None,
) -> Decimal:
    cfg = config or _defaults_as_dict()
    base = Decimal(str(cfg["base_thermal"])) if printer == "Thermal" else Decimal(str(cfg["base_inkjet"]))
    if finish == "Glossy":
        base += Decimal(str(cfg["addon_glossy"]))
    if finish == "Metallic":
        base += Decimal(str(cfg["addon_metallic"]))
    if chip_type == "RFID":
        base += Decimal(str(cfg["addon_rfid"]))
    if chip_type == "LED":
        base += Decimal(str(cfg["addon_led"]))
    if print_side == "Both Sides":
        base += Decimal(str(cfg["addon_both_sides"]))
    return base.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calc_total(unit_price: Decimal, qty: int, config: dict[str, float] | None = None) -> Decimal:
    cfg = config or _defaults_as_dict()
    discount = Decimal("1")
    if qty >= 500:
        discount = Decimal(str(1 - cfg["discount_500"] / 100))
    elif qty >= 200:
        discount = Decimal(str(1 - cfg["discount_200"] / 100))
    elif qty >= 100:
        discount = Decimal(str(1 - cfg["discount_100"] / 100))
    elif qty >= 50:
        discount = Decimal(str(1 - cfg["discount_50"] / 100))
    return (unit_price * qty * discount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_discount_label(qty: int, config: dict[str, float] | None = None) -> str:
    cfg = config or _defaults_as_dict()
    if qty >= 500:
        return f"{int(cfg['discount_500'])}% OFF"
    if qty >= 200:
        return f"{int(cfg['discount_200'])}% OFF"
    if qty >= 100:
        return f"{int(cfg['discount_100'])}% OFF"
    if qty >= 50:
        return f"{int(cfg['discount_50'])}% OFF"
    return ""


TAX_RATE = Decimal("0.05")


def calc_order_total(
    subtotal: Decimal,
    shipping_method: str,
    promo_discount: Decimal = Decimal("0"),
    config: dict[str, float] | None = None,
) -> dict:
    cfg = config or _defaults_as_dict()
    shipping_key = f"shipping_{shipping_method}"
    shipping = Decimal(str(cfg.get(shipping_key, 0.0)))
    taxable = subtotal - promo_discount
    tax = (taxable * TAX_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    grand_total = subtotal + shipping - promo_discount + tax
    return {
        "subtotal": float(subtotal),
        "shipping_cost": float(shipping),
        "promo_discount": float(promo_discount),
        "tax": float(tax),
        "grand_total": float(grand_total),
    }
