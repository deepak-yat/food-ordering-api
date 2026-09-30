from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.database import get_db
from app.dependencies import (
    get_current_customer,
    get_optional_customer,
)
from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.models.menu_item_review import MenuItemReview
from app.models.menu_item_review_tag import MenuItemReviewTag
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewsListResponse,
)
from app.services.review_rating import get_rating_detail


router = APIRouter(
    prefix="/customer",
    tags=["Customer Interactions"],
)


ALLOWED_FEEDBACK_TAGS = [
    "Tasty",
    "Fresh",
    "Good Portion",
    "Well Cooked",
    "Good Value",
]
def _oldest_unreviewed_order_item(
    db: Session,
    customer_id: int,
    item_id: int,
) -> OrderItem | None:
    already_reviewed = select(
        MenuItemReview.order_item_id
    )

    return db.exec(
        select(OrderItem)
        .join(
            Order,
            Order.order_id == OrderItem.order_id,
        )
        .where(
            Order.customer_id == customer_id,
            Order.status == OrderStatus.COMPLETED,
            OrderItem.menu_item_id == item_id,
            OrderItem.order_item_id.not_in(
                already_reviewed
            ),
        )
        .order_by(
            Order.created_at.asc()
        )
    ).first()

@router.get(
    "/menu-items/{item_id}/reviews",
    response_model=ReviewsListResponse,
)
def list_reviews(
    item_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    viewer: Customer | None = Depends(get_optional_customer),
    db: Session = Depends(get_db),
):
    item = db.get(MenuItem, item_id)

    if item is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Menu item not found",
        )

    summary = get_rating_detail(
        db,
        item_id,
    )

    offset = (page - 1) * limit

    total = db.exec(
        select(func.count())
        .select_from(MenuItemReview)
        .where(
            MenuItemReview.item_id == item_id
        )
    ).one()

    rows = db.exec(
        select(
            MenuItemReview,
            Customer.customer_name,
        )
        .join(
            Customer,
            Customer.customer_id == MenuItemReview.customer_id,
        )
        .where(
            MenuItemReview.item_id == item_id
        )
        .order_by(
            MenuItemReview.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    ).all()

    review_ids = [
        review.review_id
        for review, _ in rows
    ]

    tags_by_review: dict[int, list[str]] = {}

    if review_ids:
        for review_id, tag in db.exec(
            select(
                MenuItemReviewTag.review_id,
                MenuItemReviewTag.tag,
            )
            .where(
                MenuItemReviewTag.review_id.in_(
                    review_ids
                )
            )
        ).all():
            tags_by_review.setdefault(
                review_id,
                [],
            ).append(tag)

    reviews = [
        ReviewResponse(
            review_id=review.review_id,
            customer_name=name,
            rating=review.rating,
            comment=review.comment,
            tags=tags_by_review.get(
                review.review_id,
                [],
            ),
            verified_order=True,
            created_at=review.created_at,
            updated_at=review.updated_at,
            is_own=(
                viewer is not None
                and review.customer_id
                == viewer.customer_id
            ),
        )
        for review, name in rows
    ]

    can_review = False
    reason = "sign_in_required"

    if viewer is not None:
        eligible = _oldest_unreviewed_order_item(
            db,
            viewer.customer_id,
            item_id,
        )

        can_review = eligible is not None

        reason = (
            None
            if can_review
            else "not_purchased_or_already_reviewed"
        )

    return ReviewsListResponse(
        summary=summary,
        reviews=reviews,
        page=page,
        limit=limit,
        has_more=(page * limit) < total,
        can_review=can_review,
        cannot_review_reason=reason,
    )

@router.post(
    "/menu-items/{item_id}/reviews",
    response_model=ReviewResponse,
    status_code=201,
)
def create_review(
    item_id: int,
    data: ReviewCreate,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    order_item = _oldest_unreviewed_order_item(
        db,
        current_customer.customer_id,
        item_id,
    )

    if order_item is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "You can only review items from a completed order, and you've already reviewed this one.",
        )

    bad_tags = (
        set(data.tags)
        - set(ALLOWED_FEEDBACK_TAGS)
    )

    if bad_tags:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Unknown feedback tags: {sorted(bad_tags)}",
        )

    review = MenuItemReview(
        item_id=item_id,
        customer_id=current_customer.customer_id,
        order_item_id=order_item.order_item_id,
        rating=data.rating,
        comment=data.comment,
    )

    db.add(review)
    db.flush()

    for tag in dict.fromkeys(data.tags):
        db.add(
            MenuItemReviewTag(
                review_id=review.review_id,
                tag=tag,
            )
        )

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        review_id=review.review_id,
        customer_name=current_customer.customer_name,
        rating=review.rating,
        comment=review.comment,
        tags=list(dict.fromkeys(data.tags)),
        verified_order=True,
        created_at=review.created_at,
        updated_at=review.updated_at,
        is_own=True,
    )

@router.patch(
    "/reviews/{review_id}",
    response_model=ReviewResponse,
)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    review = db.get(
        MenuItemReview,
        review_id,
    )

    if (
        review is None
        or review.customer_id
        != current_customer.customer_id
    ):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Review not found",
        )

    bad_tags = (
        set(data.tags)
        - set(ALLOWED_FEEDBACK_TAGS)
    )

    if bad_tags:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Unknown feedback tags: {sorted(bad_tags)}",
        )

    review.rating = data.rating
    review.comment = data.comment
    review.updated_at = datetime.now(timezone.utc)

    db.add(review)

    for existing in db.exec(
        select(MenuItemReviewTag).where(
            MenuItemReviewTag.review_id
            == review_id
        )
    ).all():
        db.delete(existing)

    db.flush()

    for tag in dict.fromkeys(data.tags):
        db.add(
            MenuItemReviewTag(
                review_id=review_id,
                tag=tag,
            )
        )

    db.commit()
    db.refresh(review)

    return ReviewResponse(
        review_id=review.review_id,
        customer_name=current_customer.customer_name,
        rating=review.rating,
        comment=review.comment,
        tags=list(dict.fromkeys(data.tags)),
        verified_order=True,
        created_at=review.created_at,
        updated_at=review.updated_at,
        is_own=True,
    )

@router.delete(
    "/reviews/{review_id}",
    status_code=204,
)
def delete_review(
    review_id: int,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    review = db.get(
        MenuItemReview,
        review_id,
    )

    if (
        review is None
        or review.customer_id
        != current_customer.customer_id
    ):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Review not found",
        )

    for tag_row in db.exec(
        select(MenuItemReviewTag).where(
            MenuItemReviewTag.review_id
            == review_id
        )
    ).all():
        db.delete(tag_row)

    db.delete(review)
    db.commit()


