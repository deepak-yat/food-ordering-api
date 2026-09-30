from pydantic import BaseModel,Field

from app.schemas.menu_item_option import MenuItemOptionResponse


class MenuItemOptionGroupCreate(BaseModel):
    name: str
    selection_type: str = "SINGLE"
    price_mode: str = "ADD"
    required: bool = False
    min_selection: int = 0
    max_selection: int | None = None
    display_order: int = 0


class MenuItemOptionGroupUpdate(BaseModel):
    name: str | None = None
    selection_type: str | None = None
    price_mode: str | None = None
    required: bool | None = None
    min_selection: int | None = None
    max_selection: int | None = None
    display_order: int | None = None
    is_active: bool | None = None


class MenuItemOptionGroupResponse(BaseModel):
    group_id: int
    menu_item_id: int
    name: str
    selection_type: str
    price_mode: str
    required: bool
    min_selection: int
    max_selection: int | None
    display_order: int
    is_active: bool
    options: list[MenuItemOptionResponse] = Field(default_factory=list)
