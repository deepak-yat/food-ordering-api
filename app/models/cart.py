from sqlmodel import SQLModel,Field

class Cart(SQLModel,table=True):
    __tablename__="carts"

    cart_id : int | None = Field(
        default=None,
        primary_key=True
    )

    customer_id : int = Field(
        foreign_key="customers.customer_id",
        index=True
    )

    shop_id : int = Field(
        foreign_key="shops.shop_id",
        index=True
    )