import uuid

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    company: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20))
    google_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="CUSTOMER")
    customer_code: Mapped[str | None] = mapped_column(String(3), unique=True, nullable=True, index=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    designs = relationship("Design", back_populates="user", lazy="selectin")
    orders = relationship("Order", back_populates="user", lazy="selectin")
    templates = relationship("Template", back_populates="user", lazy="selectin")
