from sqlmodel import SQLModel, Field


class MenuItemOption(SQLModel, table=True):
    __tablename__ = "menu_item_options"

    option_id: int | None = Field(
        default=None,
        primary_key=True
    )

    group_id: int = Field(
        foreign_key="menu_item_option_groups.group_id",
        index=True
    )

    name: str

    price: float

    is_available: bool = Field(
        default=True
    )

    display_order: int = Field(
        default=0
    )