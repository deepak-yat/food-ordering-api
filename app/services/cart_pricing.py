from dataclasses import dataclass

from sqlmodel import Session, select

from app.models.cart_item import CartItem
from app.models.cart_item_option import CartItemOption
from app.models.menu_item_option import MenuItemOption
from app.models.menu_item_option_group import MenuItemOptionGroup


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
    # Calculate authoritative pricing
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

    return PricedLine(
        cart_item_id=cart_item.cart_item_id,
        menu_item_id=cart_item.menu_item_id,
        unit_price=unit_price,
        subtotal=parent_subtotal,
        options_subtotal=options_subtotal,
        line_total=line_total,
        options=priced_options,
    )