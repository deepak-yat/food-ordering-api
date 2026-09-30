from pydantic import BaseModel


class MenuItemOptionCreate(BaseModel):
    name: str
    price: float
    is_available: bool = True
    display_order: int = 0


class MenuItemOptionUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    is_available: bool | None = None
    display_order: int | None = None


class MenuItemOptionResponse(BaseModel):
    option_id: int
    group_id: int
    name: str
    price: float
    is_available: bool
    display_order: int
    offer_price: float | None = None