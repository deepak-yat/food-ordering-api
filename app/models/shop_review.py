from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


class ShopReview(SQLModel, table=True):
    __tablename__ = "shop_reviews"

    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_shop_review_rating_range",
        ),
        UniqueConstraint(
            "shop_id",
            "customer_id",
            name="uq_shop_review_customer_shop",
        ),
    )

    review_id: int | None = Field(
        default=None,
        primary_key=True,
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True,
    )

    customer_id: int = Field(
        foreign_key="customers.customer_id",
        index=True,
    )

    rating: int

    comment: str | None = Field(
        default=None,
        max_length=500,
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
        ),
    )

    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=True,
        ),
    )