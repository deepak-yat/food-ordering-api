from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey
from sqlmodel import Field, SQLModel


class Offer(SQLModel, table=True):

    __tablename__ = "offers"

    __table_args__ = (
        CheckConstraint(
            "end_at > start_at",
            name="ck_offers_window"
        ),
        CheckConstraint(
            "discount_type IN ('PERCENTAGE', 'FIXED_PRICE')",
            name="ck_offers_type"
        ),
        CheckConstraint(
            "discount_value > 0",
            name="ck_offers_value"
        ),
    )

    offer_id: int | None = Field(
        default=None,
        primary_key=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    title: str = Field(
        max_length=120
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    image_url: str | None = None

    discount_type: str

    discount_value: float

    start_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False
        )
    )

    end_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            index=True
        )
    )

    is_active: bool = Field(
        default=True
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False
        )
    )