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