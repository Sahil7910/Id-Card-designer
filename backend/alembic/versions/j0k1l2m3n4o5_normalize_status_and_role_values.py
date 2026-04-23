"""normalize status and role values to UPPERCASE

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-04-18 10:00:00.000000

Normalizes all User.role values and Order.status (+ OrderAuditLog status) values
to a single canonical UPPERCASE vocabulary:

    Roles:    CUSTOMER, DESIGN, PRINTING, SHIPPING, ADMIN
    Statuses: ENQUIRY, CONFIRM, ONHOLD, INPROGRESS, REVIEW, PRINTING, SHIPPING, DISPATCHED

Previously the codebase had mixed values (``confirmed`` vs ``confirm``,
``design_user`` vs ``DESIGN``) which broke queue filters. This migration
rewrites existing rows in place. Forward-only; downgrade is a no-op.
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, None] = "i9j0k1l2m3n4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── User roles ────────────────────────────────────────────────────────────
    op.execute("UPDATE users SET role = 'ADMIN'    WHERE role = 'admin'")
    op.execute("UPDATE users SET role = 'DESIGN'   WHERE role = 'design_user'")
    op.execute("UPDATE users SET role = 'PRINTING' WHERE role = 'printing_user'")
    op.execute("UPDATE users SET role = 'SHIPPING' WHERE role = 'shipping_user'")
    op.execute("UPDATE users SET role = 'CUSTOMER' WHERE role = 'customer'")

    # ── Order statuses ────────────────────────────────────────────────────────
    op.execute("UPDATE orders SET status = 'CONFIRM'    WHERE status IN ('confirmed','confirm','pending')")
    op.execute("UPDATE orders SET status = 'ONHOLD'     WHERE status IN ('on_hold','onhold')")
    op.execute("UPDATE orders SET status = 'INPROGRESS' WHERE status = 'inprogress'")
    op.execute("UPDATE orders SET status = 'REVIEW'     WHERE status = 'review'")
    op.execute("UPDATE orders SET status = 'PRINTING'   WHERE status IN ('printing','packaging')")
    op.execute("UPDATE orders SET status = 'SHIPPING'   WHERE status IN ('shipping','shipped')")
    op.execute("UPDATE orders SET status = 'DISPATCHED' WHERE status IN ('delivered','dispatched')")
    op.execute("UPDATE orders SET status = 'ENQUIRY'    WHERE status IN ('enquiry','rejected')")

    # ── Audit log statuses (old_status + new_status) ──────────────────────────
    for column in ("old_status", "new_status"):
        op.execute(f"UPDATE order_audit_logs SET {column} = 'CONFIRM'    WHERE {column} IN ('confirmed','confirm','pending')")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'ONHOLD'     WHERE {column} IN ('on_hold','onhold')")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'INPROGRESS' WHERE {column} = 'inprogress'")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'REVIEW'     WHERE {column} = 'review'")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'PRINTING'   WHERE {column} IN ('printing','packaging')")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'SHIPPING'   WHERE {column} IN ('shipping','shipped')")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'DISPATCHED' WHERE {column} IN ('delivered','dispatched')")
        op.execute(f"UPDATE order_audit_logs SET {column} = 'ENQUIRY'    WHERE {column} IN ('enquiry','rejected')")

    # ── Audit log changed_by_role ─────────────────────────────────────────────
    op.execute("UPDATE order_audit_logs SET changed_by_role = 'ADMIN'    WHERE changed_by_role = 'admin'")
    op.execute("UPDATE order_audit_logs SET changed_by_role = 'DESIGN'   WHERE changed_by_role = 'design_user'")
    op.execute("UPDATE order_audit_logs SET changed_by_role = 'PRINTING' WHERE changed_by_role = 'printing_user'")
    op.execute("UPDATE order_audit_logs SET changed_by_role = 'SHIPPING' WHERE changed_by_role = 'shipping_user'")
    op.execute("UPDATE order_audit_logs SET changed_by_role = 'CUSTOMER' WHERE changed_by_role = 'customer'")


def downgrade() -> None:
    # Forward-only migration — the prior mixed vocabulary was a bug worth correcting, not preserving.
    pass
