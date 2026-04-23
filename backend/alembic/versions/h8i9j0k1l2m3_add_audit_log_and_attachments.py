"""add audit log and order attachments tables

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-04-17 10:01:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "order_audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "order_id",
            sa.String(36),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("changed_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("changed_by_role", sa.String(20), nullable=True),
        sa.Column("old_status", sa.String(30), nullable=True),
        sa.Column("new_status", sa.String(30), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("changed_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "order_attachments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "order_id",
            sa.String(36),
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("uploaded_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("file_type", sa.String(20), nullable=False),  # design_sample | print_ready | reference
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("order_attachments")
    op.drop_table("order_audit_logs")
