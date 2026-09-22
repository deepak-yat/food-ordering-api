from dataclasses import dataclass

from sqlmodel import Session, select
from datetime import datetime, timezone
from app.models.cart_item import CartItem
from app.models.cart_item_option import CartItemOption
from app.models.menu_item_option import MenuItemOption
from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.offer import Offer
from app.models.offer_item import OfferItem
from app.services.offer_pricing import best_offer

def money(value: float) -> float:
    return round(float(value), 2)


@dataclass
class PricedOption:
    option_id: int
    group_id: int
    name: str
    price: float
    quantity: int
    subtotal: float
    price_mode: str
    is_available: bool
    display_order: int


@dataclass
class PricedLine:
    cart_item_id: int
    menu_item_id: int
    unit_price: float
    subtotal: float
    options_subtotal: float
    line_total: float
    options: list[PricedOption]

    original_unit_price: float
    discount_per_unit: float
    discount_total: float
    offer_id: int | None
    offer_title: str | None


def price_line(
    base_price: float,
    parent_qty: int,
    options: list[tuple[float, int, str]]
):
    unit_price = float(base_price)
    addons = 0.0

    for price, quantity, mode in options:

        if mode == "REPLACE":
            unit_price = float(price)

        elif mode == "ADD":
            addons += float(price) * quantity

    parent_subtotal = unit_price * parent_qty

    return (
        money(unit_price),
        money(parent_subtotal),
        money(addons),
        money(parent_subtotal + addons),
    )


def price_cart_item(
    db: Session,
    cart_item: CartItem,
    base_price: float,
) -> PricedLine:

    links = db.exec(
        select(CartItemOption).where(
            CartItemOption.cart_item_id ==
            cart_item.cart_item_id
        )
    ).all()

    option_ids = [
        link.option_id
        for link in links
    ]

    options_by_id = {}

    if option_ids:
        options = db.exec(
            select(MenuItemOption).where(
                MenuItemOption.option_id.in_(option_ids)
            )
        ).all()

        options_by_id = {
            option.option_id: option
            for option in options
        }

    # ----------------------------------------
    # Get all option groups for this menu item
    # ----------------------------------------

    groups = db.exec(
        select(MenuItemOptionGroup).where(
            MenuItemOptionGroup.menu_item_id ==
            cart_item.menu_item_id
        )
    ).all()

    group_by_id = {
        group.group_id: group
        for group in groups
    }

    # ----------------------------------------
    # Build pricing input
    # ----------------------------------------

    pricing_options = []

    priced_options = []

    for link in links:

        option = options_by_id.get(
            link.option_id
        )

        if option is None:
            continue

        group = group_by_id.get(
            option.group_id
        )

        if group is None:
            continue

        price_mode = group.price_mode

        if price_mode == "REPLACE":

            # REPLACE options are variants.
            # They use parent quantity.
            quantity = 1
            subtotal = 0.0

        else:

            # ADD options have their own quantity.
            quantity = link.quantity
            subtotal = money(
                option.price * quantity
            )

        priced_options.append(
            PricedOption(
                option_id=option.option_id,
                group_id=option.group_id,
                name=option.name,
                price=money(option.price),
                quantity=quantity,
                subtotal=subtotal,
                price_mode=price_mode,
                is_available=option.is_available,
                display_order=option.display_order,
            )
        )

        pricing_options.append(
            (
                option.price,
                quantity,
                price_mode,
            )
        )

    # ----------------------------------------
    # Sort options consistently
    # ----------------------------------------

    priced_options.sort(
        key=lambda option: (
            option.group_id,
            option.display_order,
            option.option_id,
        )
    )

    # ----------------------------------------
# Calculate base authoritative pricing
# ----------------------------------------

    (
        unit_price,
        parent_subtotal,
        options_subtotal,
        line_total,
    ) = price_line(
        base_price=base_price,
        parent_qty=cart_item.quantity,
        options=pricing_options,
    )

# ----------------------------------------
# Apply best live offer
# ----------------------------------------

    now = datetime.now(timezone.utc)

    live_offers = db.exec(
        select(Offer)
        .join(
            OfferItem,
            OfferItem.offer_id == Offer.offer_id,
        )
        .where(
            OfferItem.item_id == cart_item.menu_item_id,
            Offer.is_active == True,
            Offer.start_at <= now,
            Offer.end_at > now,
        )
    ).all()

    has_variant = any(
        mode == "REPLACE"
        for _, _, mode in pricing_options
    )

    selected_offer, offer_unit = best_offer(
        effective_unit=unit_price,
        has_variant=has_variant,
        offers=live_offers,
    )

    original_unit_price = money(unit_price)
    discount_per_unit = money(
    max(original_unit_price - offer_unit, 0)
    )

    discount_total = money(
        discount_per_unit * cart_item.quantity
    )

    unit_price = money(offer_unit)
    parent_subtotal = money(
        unit_price * cart_item.quantity
    )

    line_total = money(
        parent_subtotal + options_subtotal
    )

    return PricedLine(
    cart_item_id=cart_item.cart_item_id,
    menu_item_id=cart_item.menu_item_id,
    unit_price=unit_price,
    subtotal=parent_subtotal,
    options_subtotal=options_subtotal,
    line_total=line_total,
    options=priced_options,
    original_unit_price=original_unit_price,
    discount_per_unit=discount_per_unit,
    discount_total=discount_total,
    offer_id=(
        selected_offer.offer_id
        if selected_offer
        else None
    ),
    offer_title=(
        selected_offer.title
        if selected_offer
        else None
    ),
    )