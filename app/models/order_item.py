from sqlmodel import Field, SQLModel


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    order_item_id: int | None = Field(
        default=None,
        primary_key=True
    )

    order_id: int = Field(
        foreign_key="orders.order_id",
        index=True
    )

    menu_item_id: int = Field(
        foreign_key="menu_items.item_id"
    )

    item_name: str

    unit_price: float

    quantity: int

    subtotal: float

    original_unit_price: float | None = None

    discount_amount: float = 0.0

    offer_id: int | None = Field(
        default=None,
        foreign_key="offers.offer_id"
    )

    offer_title: str | None = None