from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=10)


class ReviewUpdate(ReviewCreate):
    pass


class ReviewResponse(BaseModel):
    review_id: int
    customer_name: str
    rating: int
    comment: str | None
    tags: list[str]
    verified_order: bool
    created_at: datetime
    updated_at: datetime | None
    is_own: bool


class RatingSummary(BaseModel):
    average_rating: float
    review_count: int
    rating_distribution: dict[str, int]


class ReviewsListResponse(BaseModel):
    summary: RatingSummary
    reviews: list[ReviewResponse]
    page: int
    limit: int
    has_more: bool
    can_review: bool
    cannot_review_reason: str | None