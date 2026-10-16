from datetime import datetime, timezone
from types import SimpleNamespace

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, func, select

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.customer import Customer
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderStatus
from app.models.shop import Shop
from app.schemas.recommendations import RecommendedItemResponse
from app.services.offer_pricing import (
    best_offer,
    get_live_offers_by_item,
)
from app.services.review_rating import get_rating_summary_by_item
from app.services.recommendation_engine import (
    MIN_ORDERS_FOR_PERSONALIZATION,
    apply_diversity,
    get_customer_category_affinity,
    get_customer_ordered_item_ids,
    get_recent_popularity,
    score_candidate,
)


router = APIRouter(
    prefix="/customer/recommendations",
    tags=["Customer Recommendations"],
)


@router.get(
    "",
    response_model=list[RecommendedItemResponse],
)
def get_recommended_items(
    limit: int = Query(default=10, ge=1, le=20),
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """
    Return personalized menu recommendations for the authenticated customer.

    Recommendations use completed-order history, recent popularity, ratings,
    and diversity limits. Previously purchased items are excluded.
    """

    customer_id = current_customer.customer_id

    # 1. Count the customer's completed orders.
    completed_order_count = db.exec(
        select(func.count(Order.order_id)).where(
            Order.customer_id == customer_id,
            Order.status == OrderStatus.COMPLETED,
        )
    ).one()

    has_personalization = (
        completed_order_count >= MIN_ORDERS_FOR_PERSONALIZATION
    )

    # 2. Retrieve the customer's purchase preferences.
    category_affinity = get_customer_category_affinity(
        db,
        customer_id,
    )

    previously_ordered_item_ids = get_customer_ordered_item_ids(
        db,
        customer_id,
    )

    # 3. Retrieve eligible items from active, approved shops.
    # An outer join allows items without a category to remain eligible.
    rows = db.exec(
        select(
            MenuItem,
            Shop,
            MenuCategory.category_name,
        )
        .join(
            Shop,
            Shop.shop_id == MenuItem.shop_id,
        )
        .outerjoin(
            MenuCategory,
            MenuCategory.category_id == MenuItem.category_id,
        )
        .where(
            MenuItem.is_available == True,
            Shop.is_active == True,
            Shop.is_approved == True,
        )
    ).all()

    # 4. Exclude items the customer has already purchased.
    candidates = []

    for item, shop, category_name in rows:
        if item.item_id in previously_ordered_item_ids:
            continue

        candidates.append(
            {
                "item": item,
                "shop": shop,
                "item_id": item.item_id,
                "shop_id": shop.shop_id,
                "category_name": category_name,
            }
        )

    if not candidates:
        return []

    candidate_item_ids = [
        candidate["item_id"]
        for candidate in candidates
    ]

    # 5. Retrieve popularity and ratings in bulk.
    popularity_by_item = get_recent_popularity(
        db,
        candidate_item_ids,
    )

    rating_by_item = get_rating_summary_by_item(
        db,
        candidate_item_ids,
    )

    max_popularity = max(
        popularity_by_item.values(),
        default=0,
    )

    # 6. Calculate recommendation scores and explanations.
    ranked_candidates = []

    for candidate in candidates:
        item = candidate["item"]

        # The scoring engine expects an object with a category_name attribute.
        scoring_item = SimpleNamespace(
            category_name=candidate["category_name"],
        )

        popularity_count = popularity_by_item.get(
            item.item_id,
            0,
        )

        score, reason = score_candidate(
            item=scoring_item,
            category_affinity=category_affinity,
            popularity_count=popularity_count,
            max_popularity=max_popularity,
            rating_info=rating_by_item.get(item.item_id),
            has_personalization=has_personalization,
        )

        candidate["score"] = score
        candidate["reason"] = reason
        candidate["popularity_count"] = popularity_count

        ranked_candidates.append(candidate)

    # Sort deterministically: score first, then popularity, then item ID.
    ranked_candidates.sort(
        key=lambda candidate: (
            -candidate["score"],
            -candidate["popularity_count"],
            candidate["item_id"],
        )
    )

    # 7. Apply shop and category diversity limits.
    selected = apply_diversity(
        ranked_candidates=ranked_candidates,
        limit=limit,
        max_per_shop=3,
        max_per_category=4,
    )

    if not selected:
        return []

    # 8. Retrieve live offers for the selected items in one operation.
    selected_item_ids = [
        candidate["item_id"]
        for candidate in selected
    ]

    live_offers_by_item = get_live_offers_by_item(
        db,
        selected_item_ids,
        now=datetime.now(timezone.utc),
    )

    # 9. Build the API response.
    result = []

    for candidate in selected:
        item = candidate["item"]
        shop = candidate["shop"]
        item_id = candidate["item_id"]

        item_offers = live_offers_by_item.get(
            item_id,
            [],
        )

        selected_offer, offer_price = best_offer(
            effective_unit=item.price,
            has_variant=item.has_options,
            offers=item_offers,
        )

        offer_available = selected_offer is not None

        discounted_price = None
        discount_percentage = None
        discount_label = None

        if offer_available:
            discounted_price = offer_price

            discount_percentage = round(
                (
                    (item.price - offer_price)
                    / item.price
                    * 100
                )
                if item.price > 0
                else 0,
                2,
            )

            if selected_offer.discount_type == "PERCENTAGE":
                discount_label = (
                    f"{selected_offer.discount_value:g}% OFF"
                )
            else:
                discount_label = (
                    f"₹{selected_offer.discount_value:g} OFF"
                )

        rating_info = rating_by_item.get(
            item_id,
            {},
        )

        result.append(
            RecommendedItemResponse(
                item_id=item_id,
                item_name=item.name,
                description=item.description,
                price=item.price,
                discounted_price=discounted_price,
                discount_percentage=discount_percentage,
                discount_label=discount_label,
                offer_available=offer_available,
                image_url=item.image_url,
                shop_id=shop.shop_id,
                shop_name=shop.shop_name,
                category_name=candidate["category_name"],
                has_options=item.has_options,
                allow_parent_purchase=item.allow_parent_purchase,
                is_veg=item.is_veg,
                average_rating=rating_info.get("average_rating"),
                review_count=rating_info.get("review_count", 0),
                recommendation_reason=candidate["reason"],
                recommendation_score=round(
                    candidate["score"],
                    4,
                ),
            )
        )

    return result