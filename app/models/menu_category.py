from sqlmodel import SQLModel,Field

class MenuCategory(SQLModel, table=True):
    __tablename__ = "menu_categories"

    category_id: int | None = Field(
        default=None,
        primary_key=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    category_name: str