from pydantic import BaseModel


class FeaturedItemResponse(BaseModel):
    item_id: int
    item_name: str
    price: float
    discounted_price: float | None = None
    discount_percentage: float | None = None
    discount_label: str | None = None
    image_url: str | None = None
    shop_id: int
    shop_name: str
    offer_available: bool = False