from pydantic import BaseModel


class RecommendedItemResponse(BaseModel):
    item_id: int
    item_name: str
    description: str | None = None

    price: float
    discounted_price: float | None = None
    discount_percentage: float | None = None
    discount_label: str | None = None
    offer_available: bool = False

    image_url: str | None = None

    shop_id: int
    shop_name: str

    category_name: str | None = None

    has_options: bool = False
    allow_parent_purchase: bool = True
    is_veg: bool = True

    average_rating: float | None = None
    review_count: int = 0

    recommendation_reason: str
    recommendation_score: float