from pydantic import BaseModel, Field


class AddCartItem(BaseModel):
    menu_item_id: int
    quantity: int = Field(
        gt=0
    )


class UpdateCartItem(BaseModel):
    quantity: int = Field(
        gt=0
    )

class CartItemResponse(BaseModel):
    cart_item_id: int
    menu_item_id: int
    name: str
    quantity: int
    unit_price: float
    subtotal: float


class CartResponse(BaseModel):
    cart_id: int
    shop_id: int
    items: list[CartItemResponse]
    total: float