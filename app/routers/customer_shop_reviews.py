from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.database import get_db
from app.dependencies import (
    get_current_customer,
    get_optional_customer,
)
from app.models.customer import Customer
from app.models.order import Order, OrderStatus
from app.models.shop import Shop
from app.models.shop_review import ShopReview
from app.schemas.shop_review import (
    ShopReviewCreate,
    ShopReviewUpdate,
    ShopReviewResponse,
    ShopReviewsListResponse,
    ShopRatingSummary,
)


router = APIRouter(
    prefix="/customer",
    tags=["Customer Shop Reviews"],
)


def _has_completed_order(
    db: Session,
    customer_id: int,
    shop_id: int,
) -> bool:
    order = db.exec(
        select(Order)
        .where(
            Order.customer_id == customer_id,
            Order.shop_id == shop_id,
            Order.status == OrderStatus.COMPLETED,
        )
        .limit(1)
    ).first()

    return order is not None


def _get_shop_review(
    db: Session,
    customer_id: int,
    shop_id: int,
) -> ShopReview | None:
    return db.exec(
        select(ShopReview)
        .where(
            ShopReview.shop_id == shop_id,
            ShopReview.customer_id == customer_id,
        )
    ).first()


@router.get(
    "/shops/{shop_id}/reviews",
    response_model=ShopReviewsListResponse,
)
def list_shop_reviews(
    shop_id: int,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    viewer: Customer | None = Depends(get_optional_customer),
    db: Session = Depends(get_db),
):
    shop = db.get(Shop, shop_id)

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    offset = (page - 1) * limit

    total = db.exec(
        select(func.count())
        .select_from(ShopReview)
        .where(
            ShopReview.shop_id == shop_id
        )
    ).one()

    average_rating = db.exec(
        select(func.avg(ShopReview.rating))
        .where(
            ShopReview.shop_id == shop_id
        )
    ).one()

    summary = ShopRatingSummary(
        average_rating=round(
            float(average_rating or 0),
            1,
        ),
        review_count=total,
    )

    rows = db.exec(
        select(
            ShopReview,
            Customer.customer_name,
        )
        .join(
            Customer,
            Customer.customer_id == ShopReview.customer_id,
        )
        .where(
            ShopReview.shop_id == shop_id
        )
        .order_by(
            ShopReview.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    ).all()

    reviews = [
        ShopReviewResponse(
            review_id=review.review_id,
            customer_name=name,
            rating=review.rating,
            comment=review.comment,
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
        if not _has_completed_order(
            db,
            viewer.customer_id,
            shop_id,
        ):
            reason = "not_purchased"
        elif _get_shop_review(
            db,
            viewer.customer_id,
            shop_id,
        ):
            reason = "already_reviewed"
        else:
            can_review = True
            reason = None

    return ShopReviewsListResponse(
        summary=summary,
        reviews=reviews,
        page=page,
        limit=limit,
        has_more=(page * limit) < total,
        can_review=can_review,
        cannot_review_reason=reason,
    )


@router.post(
    "/shops/{shop_id}/reviews",
    response_model=ShopReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_shop_review(
    shop_id: int,
    data: ShopReviewCreate,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    shop = db.get(Shop, shop_id)

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found",
        )

    if not _has_completed_order(
        db,
        current_customer.customer_id,
        shop_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review a shop after completing an order from that shop.",
        )

    existing_review = _get_shop_review(
        db,
        current_customer.customer_id,
        shop_id,
    )

    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this shop.",
        )

    review = ShopReview(
        shop_id=shop_id,
        customer_id=current_customer.customer_id,
        rating=data.rating,
        comment=data.comment,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return ShopReviewResponse(
        review_id=review.review_id,
        customer_name=current_customer.customer_name,
        rating=review.rating,
        comment=review.comment,
        verified_order=True,
        created_at=review.created_at,
        updated_at=review.updated_at,
        is_own=True,
    )

@router.patch(
    "/shop-reviews/{review_id}",
    response_model=ShopReviewResponse,
)
def update_shop_review(
    review_id: int,
    data: ShopReviewUpdate,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    review = db.get(
        ShopReview,
        review_id,
    )

    if (
        review is None
        or review.customer_id
        != current_customer.customer_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    review.rating = data.rating
    review.comment = data.comment
    review.updated_at = datetime.now(timezone.utc)

    db.add(review)
    db.commit()
    db.refresh(review)

    return ShopReviewResponse(
        review_id=review.review_id,
        customer_name=current_customer.customer_name,
        rating=review.rating,
        comment=review.comment,
        verified_order=True,
        created_at=review.created_at,
        updated_at=review.updated_at,
        is_own=True,
    )


@router.delete(
    "/shop-reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_shop_review(
    review_id: int,
    current_customer: Customer = Depends(
        get_current_customer
    ),
    db: Session = Depends(get_db),
):
    review = db.get(
        ShopReview,
        review_id,
    )

    if (
        review is None
        or review.customer_id
        != current_customer.customer_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    db.delete(review)
    db.commit()