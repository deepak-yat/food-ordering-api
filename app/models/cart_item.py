from sqlmodel import Field, SQLModel


class CartItem(SQLModel, table=True):
    __tablename__ = "cart_items"

    cart_item_id: int | None = Field(
        default=None,
        primary_key=True
    )

    cart_id: int = Field(
        foreign_key="carts.cart_id",
        index=True
    )

    menu_item_id: int = Field(
        foreign_key="menu_items.item_id",
        index=True
    )

    quantity: int = Field(
        default=1
    )