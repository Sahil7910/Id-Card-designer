"""add shipping pricing keys

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-07

"""
from alembic import op
import sqlalchemy as sa

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None

SHIPPING_KEYS = [
    {"key": "shipping_standard",  "value": 0.0,   "label": "Shipping — Standard (5–7 days)"},
    {"key": "shipping_express",   "value": 9.99,  "label": "Shipping — Express (2–3 days)"},
    {"key": "shipping_overnight", "value": 24.99, "label": "Shipping — Overnight (1 day)"},
]


def upgrade() -> None:
    conn = op.get_bind()
    for row in SHIPPING_KEYS:
        exists = conn.execute(
            sa.text("SELECT 1 FROM pricing_config WHERE key = :key"),
            {"key": row["key"]},
        ).fetchone()
        if not exists:
            conn.execute(
                sa.text(
                    "INSERT INTO pricing_config (key, value, label) VALUES (:key, :value, :label)"
                ),
                row,
            )


def downgrade() -> None:
    conn = op.get_bind()
    for row in SHIPPING_KEYS:
        conn.execute(
            sa.text("DELETE FROM pricing_config WHERE key = :key"),
            {"key": row["key"]},
        )
