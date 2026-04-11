"""add pricing_config and card_options tables

Revision ID: a1b2c3d4e5f6
Revises: 2838167c8a32
Create Date: 2026-04-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "2838167c8a32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pricing_config table
    op.create_table(
        "pricing_config",
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("value", sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("key"),
    )

    # card_options table
    op.create_table(
        "card_options",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("value", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("price_addon", sa.Numeric(precision=10, scale=2), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_card_options_category"), "card_options", ["category"], unique=False)

    # Seed default pricing config
    op.bulk_insert(
        sa.table(
            "pricing_config",
            sa.column("key", sa.String),
            sa.column("value", sa.Numeric),
            sa.column("label", sa.String),
        ),
        [
            {"key": "base_thermal",    "value": 2.50, "label": "Base price — Thermal printer"},
            {"key": "base_inkjet",     "value": 1.20, "label": "Base price — Inkjet printer"},
            {"key": "addon_glossy",    "value": 0.30, "label": "Add-on — Glossy finish"},
            {"key": "addon_metallic",  "value": 0.80, "label": "Add-on — Metallic finish"},
            {"key": "addon_rfid",      "value": 1.50, "label": "Add-on — RFID chip"},
            {"key": "addon_led",       "value": 2.00, "label": "Add-on — LED chip"},
            {"key": "addon_both_sides","value": 0.40, "label": "Add-on — Both sides printing"},
            {"key": "discount_50",     "value": 7.0,  "label": "Discount % for qty ≥ 50"},
            {"key": "discount_100",    "value": 12.0, "label": "Discount % for qty ≥ 100"},
            {"key": "discount_200",    "value": 18.0, "label": "Discount % for qty ≥ 200"},
            {"key": "discount_500",    "value": 25.0, "label": "Discount % for qty ≥ 500"},
        ],
    )

    # Seed default card options
    import uuid
    op.bulk_insert(
        sa.table(
            "card_options",
            sa.column("id", sa.String),
            sa.column("category", sa.String),
            sa.column("value", sa.String),
            sa.column("label", sa.String),
            sa.column("price_addon", sa.Numeric),
            sa.column("is_active", sa.Boolean),
            sa.column("sort_order", sa.Integer),
        ),
        [
            # Chip types
            {"id": str(uuid.uuid4()), "category": "chip_type", "value": "None",  "label": "No Chip",    "price_addon": 0.00, "is_active": True, "sort_order": 0},
            {"id": str(uuid.uuid4()), "category": "chip_type", "value": "RFID",  "label": "RFID Chip",  "price_addon": 1.50, "is_active": True, "sort_order": 1},
            {"id": str(uuid.uuid4()), "category": "chip_type", "value": "LED",   "label": "LED Chip",   "price_addon": 2.00, "is_active": True, "sort_order": 2},
            # Finishes
            {"id": str(uuid.uuid4()), "category": "finish",    "value": "Matte",    "label": "Matte",    "price_addon": 0.00, "is_active": True, "sort_order": 0},
            {"id": str(uuid.uuid4()), "category": "finish",    "value": "Glossy",   "label": "Glossy",   "price_addon": 0.30, "is_active": True, "sort_order": 1},
            {"id": str(uuid.uuid4()), "category": "finish",    "value": "Metallic", "label": "Metallic", "price_addon": 0.80, "is_active": True, "sort_order": 2},
            # Materials
            {"id": str(uuid.uuid4()), "category": "material",  "value": "PVC Plastic", "label": "PVC Plastic", "price_addon": 0.00, "is_active": True, "sort_order": 0},
            {"id": str(uuid.uuid4()), "category": "material",  "value": "Paper",       "label": "Paper",       "price_addon": 0.00, "is_active": True, "sort_order": 1},
            {"id": str(uuid.uuid4()), "category": "material",  "value": "Composite",   "label": "Composite",   "price_addon": 0.00, "is_active": True, "sort_order": 2},
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_card_options_category"), table_name="card_options")
    op.drop_table("card_options")
    op.drop_table("pricing_config")
