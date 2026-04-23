"""add tracking fields to orders

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-04-17 10:02:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("tracking_number", sa.String(100), nullable=True))
    op.add_column("orders", sa.Column("courier_name", sa.String(100), nullable=True))
    op.add_column("orders", sa.Column("tracking_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "tracking_url")
    op.drop_column("orders", "courier_name")
    op.drop_column("orders", "tracking_number")
