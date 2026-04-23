"""add google oauth fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-13

"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_id", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("oauth_provider", sa.String(50), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "oauth_provider")
    op.drop_column("users", "google_id")
