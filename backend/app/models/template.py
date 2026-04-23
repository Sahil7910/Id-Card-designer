import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), index=True)
    accent_color: Mapped[str | None] = mapped_column(String(7))
    bg_color: Mapped[str | None] = mapped_column(String(7))
    front_fields: Mapped[list] = mapped_column(JSON, nullable=False)
    back_fields: Mapped[list] = mapped_column(JSON, nullable=False)
    front_bg_url: Mapped[str | None] = mapped_column(String(500))
    back_bg_url: Mapped[str | None] = mapped_column(String(500))
    orientation: Mapped[str] = mapped_column(String(20), nullable=False, default="Horizontal")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    # NULL = system/public template; non-null = personal template owned by this user
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    user: Mapped["User | None"] = relationship(back_populates="templates")  # type: ignore[name-defined]
