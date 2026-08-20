from sqlmodel import SQLModel,Field

class MenuItem(SQLModel,table=True):
    __tablename__="menu_items"

    item_id: int | None = Field(
        default=None,
        primary_key=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    category_id: int | None = Field(
        default=None,
        foreign_key="menu_categories.category_id",
        index=True
    )

    name: str

    description: str | None = None

    price: float

    is_available: bool = Field(
        default=True
    )