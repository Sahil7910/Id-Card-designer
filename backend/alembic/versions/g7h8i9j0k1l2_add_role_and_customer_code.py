"""add role and customer code to users

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-04-17 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column with default 'customer'
    op.add_column("users", sa.Column("role", sa.String(20), nullable=False, server_default="customer"))
    # Add customer_code column (nullable, unique)
    op.add_column("users", sa.Column("customer_code", sa.String(3), nullable=True))
    op.create_index("ix_users_customer_code", "users", ["customer_code"], unique=True)

    # Backfill: existing admins get role='admin'
    op.execute("UPDATE users SET role='admin' WHERE is_admin=1")

    # Serial counter table for per-customer order numbering
    op.create_table(
        "order_serial_counters",
        sa.Column("customer_code", sa.String(3), primary_key=True),
        sa.Column("last_serial", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("order_serial_counters")
    op.drop_index("ix_users_customer_code", table_name="users")
    op.drop_column("users", "customer_code")
    op.drop_column("users", "role")
