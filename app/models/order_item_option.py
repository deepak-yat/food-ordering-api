from sqlmodel import SQLModel, Field


class OrderItemOption(SQLModel, table=True):
    __tablename__ = "order_item_options"

    order_item_option_id: int | None = Field(
        default=None,
        primary_key=True
    )

    order_item_id: int = Field(
        foreign_key="order_items.order_item_id",
        index=True
    )

    option_id: int | None = Field(
        default=None,
        index=True
    )

    option_name: str

    unit_price: float

    quantity: int = 1

    subtotal: float