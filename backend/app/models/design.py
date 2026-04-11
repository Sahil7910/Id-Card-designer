import uuid

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Design(Base):
    __tablename__ = "designs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), default="Untitled Design")
    printer: Mapped[str] = mapped_column(String(20), default="Thermal")
    print_side: Mapped[str] = mapped_column(String(20), default="Single Side")
    card_type: Mapped[str] = mapped_column(String(20), default="Company")
    orientation: Mapped[str] = mapped_column(String(20), default="Horizontal")
    chip_type: Mapped[str] = mapped_column(String(10), default="None")
    finish: Mapped[str] = mapped_column(String(20), default="Matte")
    material: Mapped[str] = mapped_column(String(30), default="PVC Plastic")
    front_fields: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    back_fields: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="designs")
