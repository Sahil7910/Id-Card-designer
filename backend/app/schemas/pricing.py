from typing import Literal

from pydantic import BaseModel, Field


class PricingRequest(BaseModel):
    printer: Literal["Thermal", "Inkjet"]
    finish: Literal["Matte", "Glossy", "Metallic"]
    chip_type: Literal["LED", "RFID", "None"]
    print_side: Literal["Single Side", "Both Sides"]
    quantity: int = Field(ge=10)


class PricingResponse(BaseModel):
    unit_price: float
    total_price: float
    discount_label: str
    quantity: int
