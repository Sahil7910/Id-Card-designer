"""add user_id to templates

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-17

"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("templates", sa.Column("user_id", sa.String(36), nullable=True))
    op.create_index("ix_templates_user_id", "templates", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_templates_user_id", table_name="templates")
    op.drop_column("templates", "user_id")
