from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models.offer import Offer
from app.models.offer_item import OfferItem


def money(value: float) -> float:
    return round(float(value) + 1e-9, 2)


def offer_unit_price(
    effective_unit: float,
    has_variant: bool,
    discount_type: str,
    discount_value: float,
) -> float:
    """
    Calculate the price of one item after an offer.

    PERCENTAGE:
        Applies to the effective unit price.

    FIXED_PRICE:
        Applies only to the standard/base item price.
        REPLACE variants keep their normal price.

    An offer can never increase the price.
    """

    effective_unit = money(effective_unit)

    if discount_type == "PERCENTAGE":
        offer_price = effective_unit * (
            1 - float(discount_value) / 100
        )

    elif discount_type == "FIXED_PRICE":
        if has_variant:
            offer_price = effective_unit
        else:
            offer_price = float(discount_value)

    else:
        offer_price = effective_unit

    return money(
        min(offer_price, effective_unit)
    )


def best_offer(
    effective_unit: float,
    has_variant: bool,
    offers: list[Offer],
) -> tuple[Offer | None, float]:
    """
    Select the offer producing the lowest resulting
    unit price.

    If two offers produce the same price, the offer
    with the lowest offer_id wins.
    """

    effective_unit = money(effective_unit)

    best = None
    best_price = effective_unit

    for offer in offers:
        price = offer_unit_price(
            effective_unit,
            has_variant,
            offer.discount_type,
            offer.discount_value,
        )

        if (
            best is None
            or price < best_price
            or (
                price == best_price
                and offer.offer_id < best.offer_id
            )
        ):
            best = offer
            best_price = price

    return best, best_price


def live_offer_filter(now: datetime | None = None):
    """
    Return a SQLModel filter for offers that are
    currently live.

    Start is inclusive.
    End is exclusive.
    """

    if now is None:
        now = datetime.now(timezone.utc)

    return (
        Offer.is_active == True,
        Offer.start_at <= now,
        Offer.end_at > now,
    )


def get_live_offers_by_item(
    db: Session,
    item_ids: list[int],
    now: datetime | None = None,
) -> dict[int, list[Offer]]:
    """
    Bulk-load live offers for menu items.

    Returns:
        {
            item_id: [offer, offer, ...]
        }
    """

    if not item_ids:
        return {}

    if now is None:
        now = datetime.now(timezone.utc)

    rows = db.exec(
        select(Offer, OfferItem.item_id)
        .join(
            OfferItem,
            OfferItem.offer_id == Offer.offer_id,
        )
        .where(
            OfferItem.item_id.in_(item_ids),
            Offer.is_active == True,
            Offer.start_at <= now,
            Offer.end_at > now,
        )
    ).all()

    result: dict[int, list[Offer]] = {}

    for offer, item_id in rows:
        result.setdefault(item_id, []).append(offer)

    return result