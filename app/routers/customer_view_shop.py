from fastapi import APIRouter,HTTPException,status,Depends,Query
from sqlmodel import Session,select
from datetime import datetime, timezone
from app.services.delivery import MAX_DELIVERY_DISTANCE_KM
from app.services.distance import haversine_km
from app.services.offer_pricing import (
    best_offer,
    get_live_offers_by_item,
)
from app.database import get_db
from app.models.shop import Shop
from app.schemas.customer_view_shop import CustomerShopResponse
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.schemas.customer_menu import (
    CustomerMenuCategoryResponse,
    CustomerMenuItemResponse,
    ItemOfferInfo
)

from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.menu_item_option import MenuItemOption
from app.models.menu_category import MenuCategory   
from app.schemas.menu_item_option_group import MenuItemOptionGroupResponse
from app.schemas.menu_item_option import MenuItemOptionResponse


router=APIRouter(
    prefix="/customer/view-shop",
    tags=["Customer Interactions"]
)

@router.get("", response_model=list[CustomerShopResponse])
def get_available_shops(
    db: Session = Depends(get_db),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None)
):
    print("BACKEND COORDS:", lat, lng)
    shops = db.exec(
        select(Shop).where(
            Shop.is_active == True,
            Shop.is_approved == True
        )
    ).all()
    categories = db.exec(
    select(MenuCategory)
    ).all()
    
    if lat is None or lng is None:
        result = []

        category_map = {}

        for category in categories:
            category_map.setdefault(
            category.shop_id,
            []
            ).append(category.category_name)

        for shop in shops:
            shop_data = shop.model_dump()

            shop_data["categories"] = category_map.get(
            shop.shop_id,
            []
            )

            shop_data["address_line1"] = shop.address_line1
            shop_data["city"] = shop.city

            shop_data["distance_km"] = None
            shop_data["delivery_available"] = False

            result.append(shop_data)

        return result

    shops_with_distance = []

    for shop in shops:
        if shop.latitude is None or shop.longitude is None:
            shops_with_distance.append(
                (shop, None)
            )
            continue

        distance_km = haversine_km(
            lat,
            lng,
            shop.latitude,
            shop.longitude
        )

        shops_with_distance.append(
            (shop, distance_km)
        )

    shops_with_distance.sort(
        key=lambda item: (
            item[1] is None,
            item[1] if item[1] is not None else 0
        )
    )

    result = []

    category_map = {}

    for category in categories:
        category_map.setdefault(
            category.shop_id,
            []
        ).append(category.category_name)

    for shop, distance_km in shops_with_distance:
        shop_data = shop.model_dump()
        shop_data["categories"] = category_map.get(
        shop.shop_id,
        []
        )
        shop_data["address_line1"] = shop.address_line1
        shop_data["city"] = shop.city
        if distance_km is not None:
            shop_data["distance_km"] = round(distance_km, 2)
            shop_data["delivery_available"] = (
                distance_km <= MAX_DELIVERY_DISTANCE_KM
            )
        else:
            shop_data["distance_km"] = None
            shop_data["delivery_available"] = False

        result.append(shop_data)

    return result

@router.get(
    "/{shop_id}/menu",
    response_model=list[CustomerMenuCategoryResponse]
)
def get_shop_menu(
    shop_id: int,
    db: Session = Depends(get_db)
):
    shop = db.exec(
        select(Shop).where(
            Shop.shop_id == shop_id,
            Shop.is_active == True,
            Shop.is_approved == True
        )
    ).first()

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )

    categories = db.exec(
        select(MenuCategory).where(
            MenuCategory.shop_id == shop_id
        )
    ).all()

    now = datetime.now(timezone.utc)

    all_items = db.exec(
    select(MenuItem).where(
        MenuItem.shop_id == shop_id,
        MenuItem.is_available == True
    )
    ).all()

    item_ids = [
    item.item_id
    for item in all_items
    ]

    live_offers_by_item = get_live_offers_by_item(
    db,
    item_ids,
    now=now,
    )

    result = []

    for category in categories:

        items = db.exec(
            select(MenuItem).where(
                MenuItem.shop_id == shop_id,
                MenuItem.category_id == category.category_id,
                MenuItem.is_available == True
            )
        ).all()

        customer_items = []

        for item in items:
            item_offers = live_offers_by_item.get(
                item.item_id,
                    []
                    )

            selected_offer, offer_price = best_offer(
            effective_unit=item.price,
            has_variant=False,
            offers=item_offers,
                )
            offer_info = None

            if selected_offer is not None:
                if selected_offer.discount_type == "PERCENTAGE":
                    discount_label = (
                        f"{selected_offer.discount_value:g}% OFF"
                    )
                else:
                    discount_label = (
                        f"₹{selected_offer.discount_value:g} OFF"
                    )

                discount_percent = (
                    (item.price - offer_price)
                    / item.price
                    * 100
                    if item.price > 0
                    else 0
                    )

                offer_info = ItemOfferInfo(
                    offer_id=selected_offer.offer_id,
                    title=selected_offer.title,
                    discount_type=selected_offer.discount_type,
                    discount_label=discount_label,
                    original_price=item.price,
                    offer_price=offer_price,
                    discount_percent=round(
                            discount_percent,
                            2
                        ),
                    ends_at=selected_offer.end_at.isoformat(),
                    )

            option_groups = []

            # Only load option groups when the item supports options
            if item.has_options:

                groups = db.exec(
                    select(MenuItemOptionGroup)
                    .where(
                        MenuItemOptionGroup.menu_item_id == item.item_id,
                        MenuItemOptionGroup.is_active == True
                    )
                    .order_by(
                        MenuItemOptionGroup.display_order
                    )
                ).all()

                for group in groups:

                    options = db.exec(
                        select(MenuItemOption)
                        .where(
                            MenuItemOption.group_id == group.group_id,
                            MenuItemOption.is_available == True
                        )
                        .order_by(
                            MenuItemOption.display_order
                        )
                    ).all()

                    option_groups.append(
                        MenuItemOptionGroupResponse(
                            group_id=group.group_id,
                            menu_item_id=group.menu_item_id,
                            name=group.name,
                            selection_type=group.selection_type,
                            price_mode = group.price_mode,
                            required=group.required,
                            min_selection=group.min_selection,
                            max_selection=group.max_selection,
                            display_order=group.display_order,
                            is_active=group.is_active,
                            options=[
                                MenuItemOptionResponse(
    option_id=option.option_id,
    group_id=option.group_id,
    name=option.name,
    price=option.price,
    is_available=option.is_available,
    display_order=option.display_order,
    offer_price=(
        best_offer(
            effective_unit=option.price,
            has_variant=True,
            offers=item_offers,
        )[1]
        if group.price_mode == "REPLACE"
        and item_offers
        and best_offer(
            effective_unit=option.price,
            has_variant=True,
            offers=item_offers,
        )[1] < option.price
        else None
    ),
)
                                for option in options
                            ]
                        )
                    )

            customer_items.append(
                CustomerMenuItemResponse(
                    item_id=item.item_id,
                    category_id=item.category_id,
                    name=item.name,
                    description=item.description,
                    price=item.price,
                    is_available=item.is_available,
                    image_url=item.image_url,
                    has_options=item.has_options,
                    allow_parent_purchase=item.allow_parent_purchase,
                    option_groups=option_groups,
                    offer=offer_info
                )
            )

        result.append(
            CustomerMenuCategoryResponse(
                category_id=category.category_id,
                category_name=category.category_name,
                items=customer_items
            )
        )

    return result  
