"""Deterministic, explainable recommendations for Foodly.

Version 1 deliberately uses existing order, menu, and review data. It does not
train a model, persist recommendation interactions, or call an external AI API.
Database imports are kept inside the query helpers so the scoring and diversity
functions can be unit-tested without a database connection.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlmodel import Session


RECENCY_WINDOW_DAYS = 90
POPULARITY_WINDOW_DAYS = 30
MIN_ORDERS_FOR_PERSONALIZATION = 2
MIN_REVIEWS_FOR_RATING_SIGNAL = 3

CONTENT_WEIGHT = 0.55
POPULARITY_WEIGHT = 0.30
RATING_WEIGHT = 0.15


def _utc_naive_now() -> datetime:
    """Return UTC as a naive datetime to match Order.created_at's DB column.

    The current Order model declares created_at as datetime without an explicit
    timezone-aware SQL column, so PostgreSQL stores it as a naive timestamp.
    Foodly's timestamps are created in UTC; using naive UTC avoids mixing
    timestamp types in comparisons.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_customer_category_affinity(
    db: Session,
    customer_id: int,
) -> dict[str, int]:
    """Return normalized category-name -> order-item count for recent purchases.

    Only COMPLETED orders in the last 90 days contribute. Category names are
    normalized because MenuCategory rows are shop-scoped, so category_id cannot
    be compared across different shops.
    """
    from sqlmodel import func, select

    from app.models.menu_category import MenuCategory
    from app.models.menu_item import MenuItem
    from app.models.order import Order, OrderStatus
    from app.models.order_item import OrderItem

    cutoff = _utc_naive_now() - timedelta(days=RECENCY_WINDOW_DAYS)
    rows = db.exec(
        select(
            MenuCategory.category_name,
            func.count(OrderItem.order_item_id),
        )
        .select_from(OrderItem)
        .join(Order, Order.order_id == OrderItem.order_id)
        .join(MenuItem, MenuItem.item_id == OrderItem.menu_item_id)
        .join(MenuCategory, MenuCategory.category_id == MenuItem.category_id)
        .where(
            Order.customer_id == customer_id,
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= cutoff,
        )
        .group_by(MenuCategory.category_name)
    ).all()

    affinity: dict[str, int] = {}
    for category_name, count in rows:
        normalized_name = (category_name or "").strip().lower()
        if not normalized_name:
            continue
        # Aggregate after normalization so names like "Biryani" and " biryani "
        # do not overwrite each other in the returned dictionary.
        affinity[normalized_name] = affinity.get(normalized_name, 0) + int(count)

    return affinity


def get_customer_ordered_item_ids(
    db: Session,
    customer_id: int,
) -> set[int]:
    """Return every item this customer has ever purchased in a COMPLETED order.

    These items are excluded from the recommendation candidate pool to favor
    discovery, but their categories can still inform category affinity.
    """
    from sqlmodel import select

    from app.models.order import Order, OrderStatus
    from app.models.order_item import OrderItem

    rows = db.exec(
        select(OrderItem.menu_item_id)
        .join(Order, Order.order_id == OrderItem.order_id)
        .where(
            Order.customer_id == customer_id,
            Order.status == OrderStatus.COMPLETED,
        )
    ).all()

    return {int(item_id) for item_id in rows if item_id is not None}


def get_recent_popularity(
    db: Session,
    item_ids: list[int],
) -> dict[int, int]:
    """Return completed-order counts per candidate item over the last 30 days.

    Counts distinct orders rather than order-item rows or quantity, so ordering
    multiple units of a dish in one order does not artificially inflate its
    popularity score.
    """
    if not item_ids:
        return {}

    from sqlmodel import func, select

    from app.models.order import Order, OrderStatus
    from app.models.order_item import OrderItem

    cutoff = _utc_naive_now() - timedelta(days=POPULARITY_WINDOW_DAYS)
    rows = db.exec(
        select(
            OrderItem.menu_item_id,
            func.count(func.distinct(Order.order_id)),
        )
        .join(Order, Order.order_id == OrderItem.order_id)
        .where(
            OrderItem.menu_item_id.in_(item_ids),
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= cutoff,
        )
        .group_by(OrderItem.menu_item_id)
    ).all()

    return {int(item_id): int(count) for item_id, count in rows}


def score_candidate(
    item: Any,
    category_affinity: dict[str, int],
    popularity_count: int,
    max_popularity: int,
    rating_info: dict[str, Any] | None,
    has_personalization: bool,
) -> tuple[float, str]:
    """Return (ranking score, truthful explanation) for one candidate item.

    Cold-start customers (< 2 completed orders) use popularity only. For
    personalized customers, category affinity, popularity, and sufficiently
    supported ratings can contribute to the score. Rating averages with fewer
    than three reviews are ignored.
    """
    category_name = (getattr(item, "category_name", None) or "").strip()
    normalized_category = category_name.lower()

    affinity = (
        max(0, int(category_affinity.get(normalized_category, 0)))
        if has_personalization
        else 0
    )
    affinity_score = min(affinity / 3.0, 1.0)

    popularity_score = (
        max(0, float(popularity_count)) / max_popularity
        if max_popularity > 0
        else 0.0
    )

    # Cold-start is intentionally popularity-only; do not let global ratings
    # change the ordering when there is not enough customer history yet.
    rating_score = 0.0
    rating = rating_info or {}
    review_count = int(rating.get("review_count", 0) or 0)
    if has_personalization and review_count >= MIN_REVIEWS_FOR_RATING_SIGNAL:
        average_rating = float(rating.get("average_rating", 0) or 0)
        rating_score = min(max(average_rating, 0.0), 5.0) / 5.0

    weighted = {
        "content": affinity_score * CONTENT_WEIGHT,
        "popularity": popularity_score * POPULARITY_WEIGHT,
        "rating": rating_score * RATING_WEIGHT,
    }
    total_score = sum(weighted.values())

    # The explanation is selected from the signal that actually contributed
    # most. max() is deterministic on ties because this dict is ordered.
    if not has_personalization:
        reason = (
            "Popular on Foodly"
            if popularity_count > 0
            else "Explore something new"
        )
    else:
        top_signal = max(weighted, key=weighted.get)

        if weighted[top_signal] <= 0:
            reason = "Explore something new"
        elif top_signal == "content" and category_name:
            reason = f"Based on your orders in {category_name}"
        elif top_signal == "rating":
            reason = "Highly rated by other customers"
        elif top_signal == "popularity":
            reason = "Popular on Foodly"
        else:
            reason = "Explore something new"

    return total_score, reason


def apply_diversity(
    ranked_candidates: list[dict[str, Any]],
    limit: int,
    max_per_shop: int = 3,
    max_per_category: int = 4,
) -> list[dict[str, Any]]:
    """Greedily select ranked candidates with shop/category caps.

    Candidates must already be sorted by descending score. The function keeps
    their order while skipping any candidate that would exceed a diversity cap.
    """
    if limit <= 0:
        return []

    shop_counts: dict[int, int] = {}
    category_counts: dict[str, int] = {}
    result: list[dict[str, Any]] = []

    for candidate in ranked_candidates:
        if len(result) >= limit:
            break

        shop_id = candidate["shop_id"]
        category_name = (candidate.get("category_name") or "").strip().lower()

        if shop_counts.get(shop_id, 0) >= max_per_shop:
            continue
        if category_counts.get(category_name, 0) >= max_per_category:
            continue

        result.append(candidate)
        shop_counts[shop_id] = shop_counts.get(shop_id, 0) + 1
        category_counts[category_name] = category_counts.get(category_name, 0) + 1

    return result
