from pydantic import BaseModel,Field
from app.schemas.menu_item_option_group import MenuItemOptionGroupResponse

class ItemOfferInfo(BaseModel):
    offer_id: int
    title: str
    discount_type: str
    discount_label: str
    original_price: float
    offer_price: float
    discount_percent: float
    ends_at: str


class CustomerMenuItemResponse(BaseModel):

    item_id: int
    category_id: int | None
    name: str
    description: str | None
    price: float
    is_available: bool
    image_url: str | None = None

    has_options: bool
    allow_parent_purchase: bool
    option_groups: list[MenuItemOptionGroupResponse] = Field(
        default_factory=list
    )
    offer: ItemOfferInfo | None = None


class CustomerMenuCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    items: list[CustomerMenuItemResponse]

