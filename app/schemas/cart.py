from pydantic import BaseModel, Field, field_validator
from app.schemas.menu_item_option import MenuItemOptionResponse

class AddCartItem(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0)
    option_ids: list[int] = Field(default_factory=list)
    option_quantities: dict[int, int] = Field(default_factory=dict)

    @field_validator("option_quantities")
    @classmethod
    def validate_option_quantities(cls, value):
        if any(quantity < 1 for quantity in value.values()):
            raise ValueError("Option quantities must be at least 1")
        return value

class UpdateCartItem(BaseModel):
    quantity: int = Field(
        gt=0
    )
class CartItemOptionResponse(BaseModel):
    option_id: int
    group_id: int
    name: str
    price: float
    quantity: int
    subtotal: float
    price_mode: str
    is_available: bool
    display_order: int


class CartItemResponse(BaseModel):
    cart_item_id: int
    menu_item_id: int
    name: str
    quantity: int
    unit_price: float
    subtotal: float
    options_subtotal: float = 0.0
    line_total: float
    options: list[CartItemOptionResponse] = Field(
        default_factory=list
    )
    option_ids: list[int] = Field(
        default_factory=list
    )
    original_unit_price: float
    discount_per_unit: float
    discount_total: float
    offer_id: int | None = None
    offer_title: str | None = None

class CartResponse(BaseModel):

    cart_id: int

    shop_id: int

    shop_name: str

    items: list[CartItemResponse]

    total: float


class UpdateCartItemOption(BaseModel):

    quantity: int = Field(
        ge=0
    )