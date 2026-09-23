from pydantic import BaseModel

class CustomerShopResponse(BaseModel):

    shop_id: int
    shop_name: str
    description: str | None
    is_active: bool

    address_line1: str | None = None
    city: str | None = None

    distance_km: float | None = None
    delivery_available: bool = False
    categories: list[str] = []
    image_url: str | None = None