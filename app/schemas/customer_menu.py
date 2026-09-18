from pydantic import BaseModel,Field
from app.schemas.menu_item_option_group import MenuItemOptionGroupResponse

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


class CustomerMenuCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    items: list[CustomerMenuItemResponse]