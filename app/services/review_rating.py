from sqlmodel import Session, select, func

from app.models.menu_item_review import MenuItemReview


def get_rating_summary_by_item(
    db: Session,
    item_ids: list[int],
) -> dict[int, dict]:
    """Bulk. Returns {item_id: {"average_rating": float, "review_count": int}}."""

    if not item_ids:
        return {}

    rows = db.exec(
        select(
            MenuItemReview.item_id,
            func.avg(MenuItemReview.rating),
            func.count(),
        )
        .where(
            MenuItemReview.item_id.in_(item_ids)
        )
        .group_by(
            MenuItemReview.item_id
        )
    ).all()

    return {
        item_id: {
            "average_rating": round(float(avg), 1),
            "review_count": int(count),
        }
        for item_id, avg, count in rows
    }


def get_rating_detail(
    db: Session,
    item_id: int,
) -> dict:
    """Single item, with the 5->1 distribution, for the modal."""

    rows = db.exec(
        select(
            MenuItemReview.rating,
            func.count(),
        )
        .where(
            MenuItemReview.item_id == item_id
        )
        .group_by(
            MenuItemReview.rating
        )
    ).all()

    distribution = {
        str(n): 0
        for n in range(5, 0, -1)
    }

    total = 0
    weighted = 0

    for rating, count in rows:
        distribution[str(rating)] = count
        total += count
        weighted += rating * count

    average = (
        round(weighted / total, 1)
        if total
        else 0.0
    )

    return {
        "average_rating": average,
        "review_count": total,
        "rating_distribution": distribution,
    }