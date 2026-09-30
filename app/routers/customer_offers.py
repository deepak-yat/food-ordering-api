from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.models.offer import Offer
from app.models.offer_item import OfferItem
from app.models.shop import Shop
from app.models.menu_item import MenuItem


router = APIRouter(
    prefix="/customer/offers",
    tags=["Customer Offers"],
)


@router.get("/live")
def get_live_offers(
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    offers = db.exec(
        select(Offer)
        .join(Shop, Shop.shop_id == Offer.shop_id)
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

    live_offers = []

    for offer in offers:
        item_ids = db.exec(
            select(OfferItem.item_id)
            .where(
                OfferItem.offer_id == offer.offer_id
            )
        ).all()

        available_item_exists = db.exec(
            select(MenuItem)
            .where(
                MenuItem.item_id.in_(item_ids),
                MenuItem.is_available == True,
            )
        ).first()

        if not available_item_exists:
            continue

        live_offers.append(offer)

    return live_offers