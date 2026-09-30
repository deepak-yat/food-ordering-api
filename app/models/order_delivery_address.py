from sqlmodel import SQLModel, Field


class OrderDeliveryAddress(SQLModel, table=True):
    __tablename__ = "order_delivery_addresses"

    delivery_address_id: int | None = Field(
        default=None,
        primary_key=True
    )

    order_id: int = Field(
        foreign_key="orders.order_id",
        unique=True,
        index=True
    )

    address_line1: str

    address_line2: str | None = None

    city: str

    state: str

    pincode: str