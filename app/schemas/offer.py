from datetime import datetime

from pydantic import BaseModel


class OfferCreate(BaseModel):
    title: str
    description: str | None = None
    discount_type: str
    discount_value: float
    start_at: datetime
    end_at: datetime
    is_active: bool = True
    item_ids: list[int] = []


class OfferUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    discount_type: str | None = None
    discount_value: float | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_active: bool | None = None
    item_ids: list[int] | None = None

class OfferItemResponse(BaseModel):
    item_id: int
    item_name: str
    item_price : float


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
    items: list[OfferItemResponse] = []