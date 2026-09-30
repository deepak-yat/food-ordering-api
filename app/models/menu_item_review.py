from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime
from sqlmodel import Field, SQLModel


class MenuItemReview(SQLModel, table=True):
    __tablename__ = "menu_item_reviews"

    __table_args__ = (
        CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_review_rating_range",
        ),
    )

    review_id: int | None = Field(
        default=None,
        primary_key=True,
    )

    item_id: int = Field(
        foreign_key="menu_items.item_id",
        index=True,
    )

    customer_id: int = Field(
        foreign_key="customers.customer_id",
        index=True,
    )

    order_item_id: int = Field(
        foreign_key="order_items.order_item_id",
        unique=True,
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