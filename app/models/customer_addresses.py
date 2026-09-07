from sqlmodel import SQLModel, Field


class CustomerAddress(SQLModel, table=True):
    __tablename__ = "customer_addresses"

    address_id: int | None = Field(
        default=None,
        primary_key=True
    )

    customer_id: int = Field(
        foreign_key="customers.customer_id",
        index=True
    )

    address_line1: str

    address_line2: str | None = None

    city: str

    state: str

    pincode: str

    is_default: bool = Field(
        default=False
    )

    latitude : float | None = None
    longitude : float | None = None