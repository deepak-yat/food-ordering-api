from sqlmodel import SQLModel, Field


class CartItemOption(SQLModel, table=True):
    __tablename__ = "cart_item_options"

    cart_item_option_id: int | None = Field(
        default=None,
        primary_key=True
    )

    cart_item_id: int = Field(
        foreign_key="cart_items.cart_item_id",
        index=True
    )

    option_id: int = Field(
        foreign_key="menu_item_options.option_id",
        index=True
    )
    quantity: int = Field(
        default=1,
        gt=0
    )