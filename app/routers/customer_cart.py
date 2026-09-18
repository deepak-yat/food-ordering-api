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
from app.schemas.cart import CartItemOptionResponse
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
    #
    # This must happen even when no options
    # are supplied because ADD mode detection
    # is also needed for parent-only purchases.
    # ----------------------------------------

    option_groups = db.exec(
        select(MenuItemOptionGroup).where(
            MenuItemOptionGroup.menu_item_id == menu_item.item_id,
            MenuItemOptionGroup.is_active == True
        )
    ).all()

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
        # Create option group map
        # ------------------------------------

        group_map = {
            group.group_id: group
            for group in option_groups
        }

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
        #
        # This represents a parent-only
        # purchase for an ADD-mode item.
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
    # Find the customer's existing active cart
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

    incoming_option_ids = set(data.option_ids)

    cart_item = None

    # ----------------------------------------
    # Determine whether this menu item
    # contains ADD pricing groups
    # ----------------------------------------

    add_mode = any(
        group.price_mode == "ADD"
        for group in option_groups
    )

    # ========================================================
    # ADD MODE
    # ========================================================

    if add_mode:

        # ------------------------------------
        # CASE 1:
        # Parent-only purchase
        #
        # Example:
        #
        # Chai -> Add
        #
        # option_ids = []
        #
        # This should create/increase a
        # parent-only CartItem.
        # ------------------------------------

        if not incoming_option_ids:

            # Find an existing parent-only
            # CartItem.
            for existing_item in existing_cart_items:

                existing_options = db.exec(
                    select(CartItemOption.option_id).where(
                        CartItemOption.cart_item_id ==
                        existing_item.cart_item_id
                    )
                ).all()

                if not existing_options:

                    cart_item = existing_item
                    break

            # Existing parent-only item
            if cart_item:

                cart_item.quantity += data.quantity

            # No parent-only item exists
            else:

                cart_item = CartItem(
                    cart_id=cart.cart_id,
                    menu_item_id=data.menu_item_id,
                    quantity=data.quantity
                )

                db.add(cart_item)
                db.flush()

        # ------------------------------------
        # CASE 2:
        # Add-on purchase
        #
        # Example:
        #
        # Chai
        #   + Pazham Pori
        #
        # The addon must be attached to
        # the existing parent CartItem.
        #
        # IMPORTANT:
        # Parent quantity must NOT increase.
        # ------------------------------------

        else:

            # Find the existing parent-only
            # CartItem.
            for existing_item in existing_cart_items:

                existing_options = db.exec(
                    select(CartItemOption.option_id).where(
                        CartItemOption.cart_item_id ==
                        existing_item.cart_item_id
                    )
                ).all()

                if not existing_options:

                    cart_item = existing_item
                    break

            # --------------------------------
            # Parent must exist first
            # --------------------------------

            if cart_item is None:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Please add the parent item "
                        "before adding addons"
                    )
                )

            # --------------------------------
            # Get options already attached
            # to the parent
            # --------------------------------

            existing_option_ids = set(
                db.exec(
                    select(
                        CartItemOption.option_id
                    ).where(
                        CartItemOption.cart_item_id ==
                        cart_item.cart_item_id
                    )
                ).all()
            )

            # --------------------------------
            # Attach newly selected addons
            #
            # Do NOT increase parent quantity.
            # --------------------------------

            for option in selected_options:

                if option.option_id not in existing_option_ids:

                    db.add(
    CartItemOption(
        cart_item_id=cart_item.cart_item_id,
        option_id=option.option_id,
        quantity=data.option_quantities.get(
            option.option_id,
            1
        )
    )
)

    # ========================================================
    # REPLACE MODE / NON-ADD MODE
    # ========================================================

    else:

        # ------------------------------------
        # Find exact same configuration
        # ------------------------------------

        for existing_item in existing_cart_items:

            existing_options = db.exec(
                select(CartItemOption.option_id).where(
                    CartItemOption.cart_item_id ==
                    existing_item.cart_item_id
                )
            ).all()

            existing_option_ids = set(existing_options)

            if existing_option_ids == incoming_option_ids:

                cart_item = existing_item
                break

        # ------------------------------------
        # Existing configuration
        # ------------------------------------

        if cart_item:

            cart_item.quantity += data.quantity

        # ------------------------------------
        # New configuration
        # ------------------------------------

        else:

            cart_item = CartItem(
                cart_id=cart.cart_id,
                menu_item_id=data.menu_item_id,
                quantity=data.quantity
            )

            db.add(cart_item)
            db.flush()

            # Store selected options
            for option in selected_options:

                db.add(
    CartItemOption(
        cart_item_id=cart_item.cart_item_id,
        option_id=option.option_id,
        quantity=data.option_quantities.get(
            option.option_id,
            1
        )
    )
)

    # ----------------------------------------
    # Save changes
    # ----------------------------------------

    db.commit()
    db.refresh(cart_item)

    # ----------------------------------------
    # Get the actual options currently
    # attached to this cart item
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
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
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
        # Get selected options
        # ----------------------------------------

        selected_option_ids = db.exec(
            select(CartItemOption.option_id).where(
                CartItemOption.cart_item_id ==
                cart_item.cart_item_id
            )
        ).all()

        selected_options = []

        if selected_option_ids:

            options = db.exec(
                select(MenuItemOption).where(
                    MenuItemOption.option_id.in_(
                        selected_option_ids
                    )
                )
            ).all()

            selected_options = options

        # ----------------------------------------
# Calculate authoritative unit price
# ----------------------------------------

        unit_price = menu_item.price

        options_by_group = {}

        for option in selected_options:

            options_by_group.setdefault(
            option.group_id,
            []
            ).append(option)


        for group_id, options in options_by_group.items():

            group = db.get(
        MenuItemOptionGroup,
        group_id
        )

            if group is None:
                continue

            if group.price_mode == "REPLACE":

        # SINGLE groups should normally have
        # only one option selected.
        # The validation above already enforces this.
                unit_price = options[0].price

            elif group.price_mode == "ADD":

                unit_price += sum(
                option.price
                for option in options
                )

        subtotal = (
            unit_price *
            cart_item.quantity
        )

        response_items.append(
            CartItemResponse(
                cart_item_id=cart_item.cart_item_id,
                menu_item_id=menu_item.item_id,
                name=menu_item.name,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
                options=[
                    CartItemOptionResponse(
                        option_id=option.option_id,
                        group_id=option.group_id,
                        name=option.name,
                        price=option.price,
                        is_available=option.is_available,
                        display_order=option.display_order
                    )
                    for option in selected_options
                ],
                    option_ids=[option.option_id for option in selected_options],
            )
        )

        total += subtotal

    return CartResponse(
        cart_id=cart.cart_id,
        shop_id=cart.shop_id,
        shop_name=shop.shop_name,
        items=response_items,
        total=total
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