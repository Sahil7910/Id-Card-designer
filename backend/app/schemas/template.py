from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TemplateCreate(BaseModel):
    name: str
    category: str | None = None
    accent_color: str | None = None
    bg_color: str | None = None
    front_fields: list[dict] = []
    back_fields: list[dict] = []
    front_bg_url: str | None = None
    back_bg_url: str | None = None
    orientation: str = "Horizontal"


class UserTemplateCreate(BaseModel):
    """Used by authenticated customers to save personal templates from the designer."""
    name: str
    front_fields: list[dict] = []
    back_fields: list[dict] = []
    front_bg_url: str | None = None
    back_bg_url: str | None = None
    orientation: str = "Horizontal"
    accent_color: str | None = None
    bg_color: str | None = None


class TemplateUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    accent_color: str | None = None
    bg_color: str | None = None
    front_fields: list[dict] | None = None
    back_fields: list[dict] | None = None
    front_bg_url: str | None = None
    back_bg_url: str | None = None
    orientation: str | None = None
    is_active: bool | None = None


class TemplateResponse(BaseModel):
    id: str
    name: str
    category: str | None
    accent_color: str | None
    bg_color: str | None
    front_fields: list[dict]
    back_fields: list[dict]
    front_bg_url: str | None
    back_bg_url: str | None
    orientation: str
    is_active: bool
    created_at: datetime | None
    user_id: str | None = None

    model_config = ConfigDict(from_attributes=True)
