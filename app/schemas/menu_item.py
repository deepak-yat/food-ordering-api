from pydantic import BaseModel


class MenuItemCreate(BaseModel):

    category_id: int

    name: str

    description: str | None = None

    price: float

    is_available: bool = True

    has_options: bool = False

    allow_parent_purchase: bool = True


class MenuItemUpdate(BaseModel):

    category_id: int | None = None

    name: str | None = None

    description: str | None = None

    price: float | None = None

    is_available: bool | None = None

    has_options: bool | None = None

    allow_parent_purchase: bool | None = None


class MenuItemResponse(BaseModel):

    item_id: int

    shop_id: int

    category_id: int

    name: str

    description: str | None = None

    price: float

    is_available: bool

    image_url: str | None = None

    has_options: bool

    allow_parent_purchase: bool