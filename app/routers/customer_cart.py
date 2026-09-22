from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlmodel import delete

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.schemas.cart import AddCartItem,CartResponse,CartItemResponse,UpdateCartItem
from app.models.shop import Shop
from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.menu_item_option import MenuItemOption
from app.models.cart_item_option import CartItemOption
from app.schemas.cart import CartItemOptionResponse,UpdateCartItemOption
from app.services.cart_pricing import money, price_cart_item
router = APIRouter(
    prefix="/customer/cart",
    tags=["Customer Cart"]
)

@router.post("/items")
def add_to_cart(
    data: AddCartItem,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # ----------------------------------------
    # Find the requested menu item
    # ----------------------------------------

    menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == data.menu_item_id
        )
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )

    if not menu_item.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu item is currently unavailable"
        )

    # ----------------------------------------
    # Get active option groups
    # ----------------------------------------

    option_groups = db.exec(
        select(MenuItemOptionGroup).where(
            MenuItemOptionGroup.menu_item_id == menu_item.item_id,
            MenuItemOptionGroup.is_active == True
        )
    ).all()

    # ----------------------------------------
    # Build group maps
    # ----------------------------------------

    group_map = {
        group.group_id: group
        for group in option_groups
    }

    # ----------------------------------------
    # Validate selected options
    # ----------------------------------------

    selected_options = []

    if data.option_ids:

        # ------------------------------------
        # Remove duplicate option IDs
        # ------------------------------------

        if len(data.option_ids) != len(set(data.option_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate options are not allowed"
            )

        # ------------------------------------
        # Item must support options
        # ------------------------------------

        if not menu_item.has_options:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This item does not have options"
            )

        # ------------------------------------
        # Get selected options
        # ------------------------------------

        options = db.exec(
            select(MenuItemOption).where(
                MenuItemOption.option_id.in_(data.option_ids)
            )
        ).all()

        option_map = {
            option.option_id: option
            for option in options
        }

        # ------------------------------------
        # Validate every supplied option
        # ------------------------------------

        for option_id in data.option_ids:

            option = option_map.get(option_id)

            if option is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Option {option_id} not found"
                )

            group = group_map.get(option.group_id)

            if group is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid option for this menu item"
                )

            if not option.is_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{option.name} is currently unavailable"
                )

            selected_options.append(option)

        # ------------------------------------
        # Group selected options
        # ------------------------------------

        selections_by_group = {}

        for option in selected_options:
            selections_by_group.setdefault(
                option.group_id,
                []
            ).append(option)

        # ------------------------------------
        # Validate every option group
        # ------------------------------------

        for group in option_groups:

            selected = selections_by_group.get(
                group.group_id,
                []
            )

            selected_count = len(selected)

            # SINGLE selection validation
            if (
                group.selection_type == "SINGLE"
                and selected_count > 1
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} allows only one selection"
                    )
                )

            # Minimum selection validation
            if selected_count < group.min_selection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} requires at least "
                        f"{group.min_selection} selection(s)"
                    )
                )

            # Maximum selection validation
            if (
                group.max_selection is not None
                and selected_count > group.max_selection
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} allows at most "
                        f"{group.max_selection} selection(s)"
                    )
                )

            # Required group validation
            if group.required and selected_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{group.name} is required"
                )

    else:

        # ------------------------------------
        # No options supplied
        # ------------------------------------

        if (
            menu_item.has_options
            and not menu_item.allow_parent_purchase
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select the required options"
            )

    # ----------------------------------------
    # Build option mode/group lookup
    # ----------------------------------------

    option_mode = {
        option.option_id: group_map[option.group_id].price_mode
        for option in selected_options
    }

    option_group = {
        option.option_id: option.group_id
        for option in selected_options
    }

    # ----------------------------------------
    # Incoming REPLACE and ADD options
    # ----------------------------------------

    incoming_replace = {
        option.option_id
        for option in selected_options
        if option_mode.get(option.option_id) == "REPLACE"
    }

    incoming_add = [
        option
        for option in selected_options
        if option_mode.get(option.option_id) == "ADD"
    ]

    # ----------------------------------------
    # Find customer's existing active cart
    # ----------------------------------------

    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    # ----------------------------------------
    # No cart yet -> create cart
    # ----------------------------------------

    if cart is None:

        cart = Cart(
            customer_id=current_customer.customer_id,
            shop_id=menu_item.shop_id
        )

        db.add(cart)
        db.flush()

    # ----------------------------------------
    # Cart belongs to another shop
    # ----------------------------------------

    elif cart.shop_id != menu_item.shop_id:

        current_shop = db.get(
            Shop,
            cart.shop_id
        )

        requested_shop = db.get(
            Shop,
            menu_item.shop_id
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": (
                    "Your cart contains items from another shop."
                ),
                "current_shop_id": cart.shop_id,
                "current_shop_name": (
                    current_shop.shop_name
                    if current_shop
                    else None
                ),
                "requested_shop_id": menu_item.shop_id,
                "requested_shop_name": (
                    requested_shop.shop_name
                    if requested_shop
                    else None
                )
            }
        )

    # ----------------------------------------
    # Find existing cart items for this
    # menu item
    # ----------------------------------------

    existing_cart_items = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.menu_item_id == data.menu_item_id
        )
    ).all()

    # ----------------------------------------
    # Helper: load options attached to a row
    # ----------------------------------------

    def load_links(cart_item):
        return db.exec(
            select(CartItemOption).where(
                CartItemOption.cart_item_id ==
                cart_item.cart_item_id
            )
        ).all()

    # ----------------------------------------
    # Find matching CartItem
    #
    # IMPORTANT:
    #
    # CartItem identity is:
    #
    # cart + menu_item + REPLACE options
    #
    # ADD options do NOT create a new CartItem.
    # ----------------------------------------

    cart_item = None

    for row in existing_cart_items:

        existing_links = load_links(row)

        existing_replace = {
            link.option_id
            for link in existing_links
            if option_mode.get(link.option_id) == "REPLACE"
        }

        if existing_replace == incoming_replace:
            cart_item = row
            break

    # ----------------------------------------
    # Validate final option selection
    #
    # This matters when ADD options are being
    # attached to an existing CartItem.
    # ----------------------------------------

    if data.option_ids:

        if cart_item:

            final_ids = {
                link.option_id
                for link in load_links(cart_item)
            }

        else:
            final_ids = set()

        final_ids |= set(data.option_ids)

        selections = {}

        # Build group lookup using all active
        # groups for this menu item.
        all_option_groups = {
            group.group_id: group
            for group in option_groups
        }

        # We need the option -> group relationship
        # for options already attached to the row.
        attached_option_ids = list(final_ids)

        if attached_option_ids:

            attached_options = db.exec(
                select(MenuItemOption).where(
                    MenuItemOption.option_id.in_(
                        attached_option_ids
                    )
                )
            ).all()

            for option in attached_options:

                group_id = option.group_id

                if group_id in all_option_groups:
                    selections.setdefault(
                        group_id,
                        set()
                    ).add(option.option_id)

        for group in option_groups:

            count = len(
                selections.get(
                    group.group_id,
                    set()
                )
            )

            # SINGLE selection validation
            if (
                group.selection_type == "SINGLE"
                and count > 1
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} allows only one selection"
                    )
                )

            # Minimum selection validation
            if count < group.min_selection:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} requires at least "
                        f"{group.min_selection} selection(s)"
                    )
                )

            # Maximum selection validation
            if (
                group.max_selection is not None
                and count > group.max_selection
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"{group.name} allows at most "
                        f"{group.max_selection} selection(s)"
                    )
                )

            # Required group validation
            if group.required and count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{group.name} is required"
                )

    # ----------------------------------------
    # Create new CartItem
    # ----------------------------------------

    if cart_item is None:

        cart_item = CartItem(
            cart_id=cart.cart_id,
            menu_item_id=data.menu_item_id,
            quantity=data.quantity
        )

        db.add(cart_item)
        db.flush()

        # Only REPLACE options belong to the
        # identity of the parent row.
        #
        # ADD options are attached separately
        # below.
        for option in selected_options:

            if option_mode.get(option.option_id) == "REPLACE":

                db.add(
                    CartItemOption(
                        cart_item_id=cart_item.cart_item_id,
                        option_id=option.option_id,
                        quantity=1
                    )
                )

    # ----------------------------------------
    # Existing CartItem
    #
    # If this request contains only ADD options,
    # parent quantity must remain unchanged.
    #
    # If this is a normal/REPLACE parent add,
    # increase parent quantity.
    # ----------------------------------------

    elif not incoming_add:

        cart_item.quantity += data.quantity

    # ----------------------------------------
    # Handle ADD options
    # ----------------------------------------

    links = {
        link.option_id: link
        for link in load_links(cart_item)
    }

    for option in incoming_add:

        qty = data.option_quantities.get(
            option.option_id,
            1
        )

        if option.option_id in links:

            # Existing addon:
            # increase addon quantity only.
            links[option.option_id].quantity += qty

        else:

            # New addon:
            # attach to existing parent.
            db.add(
                CartItemOption(
                    cart_item_id=cart_item.cart_item_id,
                    option_id=option.option_id,
                    quantity=qty
                )
            )

    # ----------------------------------------
    # Save changes
    # ----------------------------------------

    db.commit()
    db.refresh(cart_item)

    # ----------------------------------------
    # Get actual options currently attached
    # ----------------------------------------

    current_option_ids = db.exec(
        select(CartItemOption.option_id).where(
            CartItemOption.cart_item_id ==
            cart_item.cart_item_id
        )
    ).all()

    # ----------------------------------------
    # Return response
    # ----------------------------------------

    return {
        "message": "Item added to cart",
        "cart_id": cart.cart_id,
        "cart_item_id": cart_item.cart_item_id,
        "menu_item_id": cart_item.menu_item_id,
        "quantity": cart_item.quantity,
        "option_ids": current_option_ids
    }
@router.get(
    "",
    response_model=CartResponse
)
def get_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    shop = db.get(
        Shop,
        cart.shop_id
    )

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    cart_items = db.exec(
        select(CartItem)
        .where(
            CartItem.cart_id == cart.cart_id
        )
        .order_by(CartItem.cart_item_id)
    ).all()

    response_items = []
    total = 0.0

    for cart_item in cart_items:

        menu_item = db.get(
            MenuItem,
            cart_item.menu_item_id
        )

        if menu_item is None:
            continue

        # ----------------------------------------
        # Calculate authoritative cart pricing
        # ----------------------------------------

        line = price_cart_item(
            db=db,
            cart_item=cart_item,
            base_price=menu_item.price
        )

        # ----------------------------------------
        # Convert priced options to response
        # ----------------------------------------

        response_options = [
            CartItemOptionResponse(
                option_id=option.option_id,
                group_id=option.group_id,
                name=option.name,
                price=option.price,
                quantity=option.quantity,
                subtotal=option.subtotal,
                price_mode=option.price_mode,
                is_available=option.is_available,
                display_order=option.display_order,
            )
            for option in line.options
        ]

        # ----------------------------------------
        # Build cart item response
        # ----------------------------------------

        response_items.append(
            CartItemResponse(
                cart_item_id=cart_item.cart_item_id,
                menu_item_id=menu_item.item_id,
                name=menu_item.name,
                quantity=cart_item.quantity,
                unit_price=line.unit_price,
                subtotal=line.subtotal,
                options_subtotal=line.options_subtotal,
                line_total=line.line_total,
                original_unit_price=line.original_unit_price,
                discount_per_unit=line.discount_per_unit,
                discount_total=line.discount_total,
                offer_id=line.offer_id,
                offer_title=line.offer_title,
                options=response_options,
                option_ids=[
                        option.option_id
                            for option in line.options
                        ],
                    )
                )

        total += line.line_total

    return CartResponse(
        cart_id=cart.cart_id,
        shop_id=cart.shop_id,
        shop_name=shop.shop_name,
        items=response_items,
        total=money(total)
    )
@router.put("/items/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    data: UpdateCartItem,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart_item = db.exec(
        select(CartItem)
        .join(Cart)
        .where(
            CartItem.cart_item_id == cart_item_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    cart_item.quantity = data.quantity

    db.commit()
    db.refresh(cart_item)

    return {
        "message": "Cart item updated successfully",
        "cart_item_id": cart_item.cart_item_id,
        "quantity": cart_item.quantity
    }


@router.delete("/items/{cart_item_id}")
def remove_cart_item(
    cart_item_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart_item = db.exec(
        select(CartItem)
        .join(Cart)
        .where(
            CartItem.cart_item_id == cart_item_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    cart = db.get(
        Cart,
        cart_item.cart_id
    )

    db.exec(
    delete(CartItemOption).where(
        CartItemOption.cart_item_id == cart_item.cart_item_id
    )
)

    db.delete(cart_item)

    db.flush()

    remaining_item = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
    ).first()

    if remaining_item is None:
        db.delete(cart)

    db.commit()

    return {
        "message": "Item removed from cart",
        "cart_item_id": cart_item_id
    }
@router.delete("")
def delete_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    cart_items = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
    ).all()

    # Delete cart item options first,
    # then delete the cart items
    for cart_item in cart_items:

        cart_item_options = db.exec(
            select(CartItemOption).where(
                CartItemOption.cart_item_id ==
                cart_item.cart_item_id
            )
        ).all()

        for cart_item_option in cart_item_options:
            db.delete(cart_item_option)

        db.delete(cart_item)

    db.flush()

    # Finally delete the cart itself
    db.delete(cart)

    db.commit()

    return {
        "message": "Cart cleared successfully"
    }


@router.put("/items/{cart_item_id}/options/{option_id}")
def update_cart_item_option(
    cart_item_id: int,
    option_id: int,
    data: UpdateCartItemOption,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # ----------------------------------------
    # Verify cart item belongs to current customer
    # ----------------------------------------

    cart_item = db.exec(
        select(CartItem)
        .join(Cart)
        .where(
            CartItem.cart_item_id == cart_item_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    # ----------------------------------------
    # Get option
    # ----------------------------------------

    option = db.get(
        MenuItemOption,
        option_id
    )

    if option is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option not found"
        )

    # ----------------------------------------
    # Verify option belongs to this menu item
    # ----------------------------------------

    group = db.exec(
        select(MenuItemOptionGroup).where(
            MenuItemOptionGroup.group_id == option.group_id,
            MenuItemOptionGroup.menu_item_id ==
            cart_item.menu_item_id
        )
    ).first()

    if group is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Option does not belong to this menu item"
        )

    # ----------------------------------------
    # Only ADD options have independent quantity
    # ----------------------------------------

    if group.price_mode != "ADD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ADD options can have their own quantity"
        )

    # ----------------------------------------
    # Option/group availability
    # ----------------------------------------

    if not group.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Option group is inactive"
        )

    if not option.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{option.name} is currently unavailable"
        )

    # ----------------------------------------
    # Find existing link
    # ----------------------------------------

    cart_item_option = db.exec(
        select(CartItemOption).where(
            CartItemOption.cart_item_id == cart_item_id,
            CartItemOption.option_id == option_id
        )
    ).first()

    # ----------------------------------------
    # Quantity 0 -> remove addon
    # ----------------------------------------

    if data.quantity == 0:

        if cart_item_option is None:
            return {
                "message": "Cart item option removed successfully",
                "cart_item_id": cart_item_id,
                "option_id": option_id,
                "quantity": 0
            }

        # ------------------------------------
        # Check remaining selections in group
        # ------------------------------------

        group_links = db.exec(
            select(CartItemOption)
            .join(
                MenuItemOption,
                MenuItemOption.option_id ==
                CartItemOption.option_id
            )
            .where(
                CartItemOption.cart_item_id == cart_item_id,
                MenuItemOption.group_id == group.group_id
            )
        ).all()

        remaining_count = len(group_links) - 1

        # Required/minimum selection validation
        if remaining_count < group.min_selection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{group.name} requires at least "
                    f"{group.min_selection} selection(s)"
                )
            )

        if group.required and remaining_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{group.name} is required"
            )

        db.delete(cart_item_option)
        db.commit()

        return {
            "message": "Cart item option removed successfully",
            "cart_item_id": cart_item_id,
            "option_id": option_id,
            "quantity": 0
        }

    # ----------------------------------------
    # Quantity > 0
    # ----------------------------------------

    # ----------------------------------------
    # Get all ADD options currently attached
    # to this group
    # ----------------------------------------

    group_links = db.exec(
        select(CartItemOption)
        .join(
            MenuItemOption,
            MenuItemOption.option_id ==
            CartItemOption.option_id
        )
        .where(
            CartItemOption.cart_item_id == cart_item_id,
            MenuItemOption.group_id == group.group_id
        )
    ).all()

    existing_option_ids = {
        link.option_id
        for link in group_links
    }

    # ----------------------------------------
    # If this is a new option, validate
    # selection limits
    # ----------------------------------------

    if cart_item_option is None:

        current_selection_count = len(
            existing_option_ids
        )

        # SINGLE selection validation
        if (
            group.selection_type == "SINGLE"
            and current_selection_count >= 1
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{group.name} allows only one selection"
                )
            )

        # Maximum selection validation
        if (
            group.max_selection is not None
            and current_selection_count >= group.max_selection
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"{group.name} allows at most "
                    f"{group.max_selection} selection(s)"
                )
            )

        # ------------------------------------
        # Create addon link
        # ------------------------------------

        cart_item_option = CartItemOption(
            cart_item_id=cart_item_id,
            option_id=option_id,
            quantity=data.quantity
        )

        db.add(cart_item_option)

    else:

        # ------------------------------------
        # Existing addon -> update quantity
        # ------------------------------------

        cart_item_option.quantity = data.quantity

    # ----------------------------------------
    # Save
    # ----------------------------------------

    db.commit()
    db.refresh(cart_item_option)

    return {
        "message": "Cart item option updated successfully",
        "cart_item_id": cart_item_id,
        "option_id": option_id,
        "quantity": cart_item_option.quantity
    }