import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.database import get_db
from app.models.menu_item import MenuItem
from app.models.shop import Shop
from app.schemas.featured_items import FeaturedItemResponse
from app.services.offer_pricing import best_offer, get_live_offers_by_item


router = APIRouter(
    prefix="/customer/featured-items",
    tags=["Customer Interactions"]
)


@router.get("", response_model=list[FeaturedItemResponse])
def get_featured_items(
    limit: int = Query(default=10, ge=1, le=20),
    db: Session = Depends(get_db),
):
    rows = db.exec(
        select(MenuItem, Shop)
        .join(
            Shop,
            Shop.shop_id == MenuItem.shop_id
        )
        .where(
            MenuItem.is_available == True,
            MenuItem.has_options == False,
            Shop.is_active == True,
            Shop.is_approved == True,
        )
    ).all()

    by_shop: dict[int, list[tuple[MenuItem, Shop]]] = {}

    for item, shop in rows:
        by_shop.setdefault(
            shop.shop_id,
            []
        ).append((item, shop))

    shop_ids = list(by_shop.keys())

    random.shuffle(shop_ids)

    picked_shop_ids = shop_ids[:limit]

    selected = [
        random.choice(by_shop[shop_id])
        for shop_id in picked_shop_ids
    ]

    random.shuffle(selected)

    item_ids = [
        item.item_id
        for item, _ in selected
    ]

    now = datetime.now(timezone.utc)

    live_offers_by_item = get_live_offers_by_item(
        db,
        item_ids,
        now=now
    )

    result = []

    for item, shop in selected:
        item_offers = live_offers_by_item.get(
            item.item_id,
            []
        )

        selected_offer, offer_price = best_offer(
            effective_unit=item.price,
            has_variant=False,
            offers=item_offers,
        )

        discounted_price = None
        discount_percentage = None
        discount_label = None
        offer_available = False

        if selected_offer is not None:
            offer_available = True
            discounted_price = offer_price

            discount_percentage = round(
                (
                    (item.price - offer_price)
                    / item.price
                    * 100
                )
                if item.price > 0
                else 0,
                2
            )

            if selected_offer.discount_type == "PERCENTAGE":
                discount_label = (
                    f"{selected_offer.discount_value:g}% OFF"
                )
            else:
                discount_label = (
                    f"₹{selected_offer.discount_value:g} OFF"
                )

        result.append(
            FeaturedItemResponse(
                item_id=item.item_id,
                item_name=item.name,
                price=item.price,
                discounted_price=discounted_price,
                discount_percentage=discount_percentage,
                discount_label=discount_label,
                image_url=item.image_url,
                shop_id=shop.shop_id,
                shop_name=shop.shop_name,
                offer_available=offer_available,
            )
        )

    return result