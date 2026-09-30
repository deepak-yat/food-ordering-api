from sqlmodel import SQLModel, Field


class MenuItemOptionGroup(SQLModel, table=True):
    __tablename__ = "menu_item_option_groups"

    group_id: int | None = Field(
        default=None,
        primary_key=True
    )

    menu_item_id: int = Field(
        foreign_key="menu_items.item_id",
        index=True
    )

    name: str

    selection_type: str = Field(
        default="SINGLE"
    )

    price_mode : str = Field(
        default="ADD"
    )

    required: bool = Field(
        default=False
    )

    min_selection: int = Field(
        default=0
    )

    max_selection: int | None = Field(
        default=None
    )

    display_order: int = Field(
        default=0
    )

    is_active: bool = Field(
        default=True
    )