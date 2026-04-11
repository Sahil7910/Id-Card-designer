from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ShippingAddress(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    company: str = ""
    address1: str
    address2: str = ""
    city: str
    state: str
    zip: str
    country: str


class OrderItemCreate(BaseModel):
    card_type: str
    printer: Literal["Thermal", "Inkjet"]
    print_side: Literal["Single Side", "Both Sides"]
    orientation: Literal["Horizontal", "Vertical"]
    chip_type: Literal["LED", "RFID", "None"]
    finish: Literal["Matte", "Glossy", "Metallic"]
    material: Literal["PVC Plastic", "Paper", "Composite"]
    quantity: int = Field(ge=10)
    design_id: str | None = None
    front_field_count: int = 0
    back_field_count: int = 0


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    shipping: ShippingAddress
    shipping_method: Literal["standard", "express", "overnight"]
    payment_method: Literal["card", "upi", "netbanking", "cod"]
    # Razorpay verification fields (required for non-COD payments)
    razorpay_payment_id: str | None = None
    razorpay_order_id: str | None = None
    razorpay_signature: str | None = None


class OrderItemResponse(BaseModel):
    id: str
    card_type: str
    printer: str
    print_side: str
    orientation: str
    chip_type: str
    finish: str
    material: str
    quantity: int
    unit_price: float
    total_price: float
    front_field_count: int
    back_field_count: int

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    shipping_address: dict
    shipping_method: str
    shipping_cost: float
    payment_method: str
    subtotal: float
    promo_discount: float
    tax: float
    grand_total: float
    total_cards: int
    items: list[OrderItemResponse]
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: Literal["confirmed", "printing", "packaging", "shipped", "delivered"]
