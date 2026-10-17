from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models.offer import Offer
from app.models.offer_item import OfferItem
from app.models.shop import Shop
from app.models.menu_item import MenuItem
from app.schemas.offer import (
    CustomerLiveOfferResponse,
    OfferItemResponse,
)


router = APIRouter(
    prefix="/customer/offers",
    tags=["Customer Offers"],
)


@router.get(
    "/live",
    response_model=list[CustomerLiveOfferResponse],
)
def get_live_offers(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Fetch currently live offers belonging to active,
    # approved shops. Keep the existing ordering and limit.
    offer_rows = db.exec(
        select(Offer, Shop.shop_name)
        .join(
            Shop,
            Shop.shop_id == Offer.shop_id,
        )
        .where(
            Offer.is_active == True,
            Offer.start_at <= now,
            Offer.end_at > now,
            Shop.is_active == True,
            Shop.is_approved == True,
        )
        .order_by(
            Offer.end_at,
            Offer.offer_id,
        )
        .limit(20)
    ).all()

    if not offer_rows:
        return []

    # Extract offer IDs for a single bulk item query.
    offer_ids = [
        offer.offer_id
        for offer, _ in offer_rows
    ]

    # Fetch available eligible menu items in bulk.
    # Ensure each item belongs to the shop that owns
    # its associated offer.
    item_rows = db.exec(
        select(OfferItem.offer_id, MenuItem)
        .join(
            MenuItem,
            MenuItem.item_id == OfferItem.item_id,
        )
        .join(
            Offer,
            Offer.offer_id == OfferItem.offer_id,
        )
        .where(
            OfferItem.offer_id.in_(offer_ids),
            MenuItem.shop_id == Offer.shop_id,
            MenuItem.is_available == True,
        )
        .order_by(MenuItem.name)
    ).all()

    # Group eligible items by offer ID.
    items_by_offer: dict[int, list[OfferItemResponse]] = {}

    for offer_id, item in item_rows:
        items_by_offer.setdefault(offer_id, []).append(
            OfferItemResponse(
                item_id=item.item_id,
                item_name=item.name,
                item_price=item.price,
            )
        )

    live_offers = []

    for offer, shop_name in offer_rows:
        # Do not return offers without any available,
        # eligible menu items.
        eligible_items = items_by_offer.get(
            offer.offer_id,
            [],
        )

        if not eligible_items:
            continue

        live_offers.append(
            CustomerLiveOfferResponse(
                offer_id=offer.offer_id,
                shop_id=offer.shop_id,
                shop_name=shop_name,
                title=offer.title,
                description=offer.description,
                image_url=offer.image_url,
                discount_type=offer.discount_type,
                discount_value=offer.discount_value,
                start_at=offer.start_at,
                end_at=offer.end_at,
                template_id=offer.template_id,
                design_config=offer.design_config or {},
                items=eligible_items,
            )
        )

    return live_offers