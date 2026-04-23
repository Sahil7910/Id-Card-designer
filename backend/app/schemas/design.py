from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DesignCreate(BaseModel):
    name: str = "Untitled Design"
    printer: Literal["Thermal", "Inkjet"] = "Thermal"
    print_side: Literal["Single Side", "Both Sides"] = "Single Side"
    card_type: Literal["Company", "School", "Others"] = "Company"
    orientation: Literal["Horizontal", "Vertical"] = "Horizontal"
    chip_type: Literal["LED", "RFID", "None"] = "None"
    finish: Literal["Matte", "Glossy", "Metallic"] = "Matte"
    material: Literal["PVC Plastic", "Paper", "Composite"] = "PVC Plastic"
    front_fields: list[dict] = Field(default_factory=list)
    back_fields: list[dict] = Field(default_factory=list)


class DesignUpdate(BaseModel):
    name: str | None = None
    printer: Literal["Thermal", "Inkjet"] | None = None
    print_side: Literal["Single Side", "Both Sides"] | None = None
    card_type: Literal["Company", "School", "Others"] | None = None
    orientation: Literal["Horizontal", "Vertical"] | None = None
    chip_type: Literal["LED", "RFID", "None"] | None = None
    finish: Literal["Matte", "Glossy", "Metallic"] | None = None
    material: Literal["PVC Plastic", "Paper", "Composite"] | None = None
    front_fields: list[dict] | None = None
    back_fields: list[dict] | None = None
    thumbnail_url: str | None = None


class DesignResponse(BaseModel):
    id: str
    user_id: str
    name: str
    printer: str
    print_side: str
    card_type: str
    orientation: str
    chip_type: str
    finish: str
    material: str
    front_fields: list[dict]
    back_fields: list[dict]
    thumbnail_url: str | None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
