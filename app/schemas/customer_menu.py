from pydantic import BaseModel


class CustomerMenuItemResponse(BaseModel):
    item_id: int
    category_id: int | None
    name: str
    description: str | None
    price: float
    is_available: bool


class CustomerMenuCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    items: list[CustomerMenuItemResponse]