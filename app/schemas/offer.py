from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


OfferTemplateId = Literal[
    "premium_feast",
    "sweet_playful",
    "urban_crave",
    "editorial_pop",
    "explosive_deals",
    "fresh_minimal",
]

class OfferCreate(BaseModel):
    title: str
    description: str | None = None

    discount_type: str
    discount_value: float

    start_at: datetime
    end_at: datetime
    is_active: bool = True

    item_ids: list[int] = Field(default_factory=list)

    # Dynamic offer template settings
    template_id: OfferTemplateId = "premium_feast"
    design_config: dict[str, Any] = Field(default_factory=dict)


class OfferUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

    discount_type: str | None = None
    discount_value: float | None = None

    start_at: datetime | None = None
    end_at: datetime | None = None
    is_active: bool | None = None

    item_ids: list[int] | None = None

    # Optional during updates so existing offers remain compatible
    template_id: OfferTemplateId | None = None
    design_config: dict[str, Any] | None = None


class OfferItemResponse(BaseModel):
    item_id: int
    item_name: str
    item_price: float


class OfferResponse(BaseModel):
    offer_id: int
    shop_id: int

    title: str
    description: str | None = None
    image_url: str | None = None

    discount_type: str
    discount_value: float

    start_at: datetime
    end_at: datetime
    is_active: bool
    status: str

    items: list[OfferItemResponse] = Field(default_factory=list)

    # Template information returned to the frontend
    template_id: OfferTemplateId = "premium_feast"
    design_config: dict[str, Any] = Field(default_factory=dict)

class CustomerLiveOfferResponse(BaseModel):
    offer_id: int
    shop_id: int
    shop_name: str

    title: str
    description: str | None = None
    image_url: str | None = None

    discount_type: str
    discount_value: float

    start_at: datetime
    end_at: datetime

    template_id: OfferTemplateId = "premium_feast"
    design_config: dict[str, Any] = Field(default_factory=dict)

    items: list[OfferItemResponse] = Field(default_factory=list)