import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    # Shipping
    shipping_address: Mapped[dict] = mapped_column(JSON, nullable=False)
    shipping_method: Mapped[str] = mapped_column(String(20), default="standard")
    shipping_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    # Payment
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)
    payment_ref: Mapped[str | None] = mapped_column(String(100))
    # Totals
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    promo_discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    grand_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_cards: Mapped[int] = mapped_column(Integer, nullable=False)
    # Timestamps
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id"), nullable=False)
    design_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("designs.id"), nullable=True)
    card_type: Mapped[str] = mapped_column(String(20))
    printer: Mapped[str] = mapped_column(String(20))
    print_side: Mapped[str] = mapped_column(String(20))
    orientation: Mapped[str] = mapped_column(String(20))
    chip_type: Mapped[str] = mapped_column(String(10))
    finish: Mapped[str] = mapped_column(String(20))
    material: Mapped[str] = mapped_column(String(30))
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    front_field_count: Mapped[int] = mapped_column(Integer, default=0)
    back_field_count: Mapped[int] = mapped_column(Integer, default=0)

    order = relationship("Order", back_populates="items")
