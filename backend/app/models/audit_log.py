import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderAuditLog(Base):
    __tablename__ = "order_audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    changed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    changed_by_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="audit_logs")
