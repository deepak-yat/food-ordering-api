from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel


class OfferItem(SQLModel, table=True):

    __tablename__ = "offer_items"

    offer_id: int = Field(
        sa_column=Column(
            ForeignKey(
                "offers.offer_id",
                ondelete="CASCADE"
            ),
            primary_key=True
        )
    )

    item_id: int = Field(
        sa_column=Column(
            ForeignKey(
                "menu_items.item_id",
                ondelete="CASCADE"
            ),
            primary_key=True,
            index=True
        )
    )