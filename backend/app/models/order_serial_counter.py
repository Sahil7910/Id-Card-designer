from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OrderSerialCounter(Base):
    __tablename__ = "order_serial_counters"

    customer_code: Mapped[str] = mapped_column(String(3), primary_key=True)
    last_serial: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
