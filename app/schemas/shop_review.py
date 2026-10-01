from datetime import datetime

from pydantic import BaseModel, Field


class ShopReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(
        default=None,
        max_length=500,
    )


class ShopReviewUpdate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(
        default=None,
        max_length=500,
    )


class ShopReviewResponse(BaseModel):
    review_id: int
    customer_name: str
    rating: int
    comment: str | None
    verified_order: bool
    created_at: datetime
    updated_at: datetime | None
    is_own: bool


class ShopRatingSummary(BaseModel):
    average_rating: float
    review_count: int


class ShopReviewsListResponse(BaseModel):
    summary: ShopRatingSummary
    reviews: list[ShopReviewResponse]
    page: int
    limit: int
    has_more: bool
    can_review: bool
    cannot_review_reason: str | None = None