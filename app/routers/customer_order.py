from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import desc
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import get_current_customer

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.customer_addresses import CustomerAddress
from app.models.order_delivery_address import OrderDeliveryAddress
from app.models.shop import Shop
from app.models.cart_item_option import CartItemOption
from app.schemas.order import (
    CreateOrderRequest,
    OrderResponse,
    OrderItemResponse,
    OrderDeliveryAddressResponse
)
from app.models.order_item_option import OrderItemOption
from app.services.cart_pricing import price_cart_item
from app.services.routing import calculate_delivery_distance
from app.services.delivery import calculate_delivery_fee
from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.menu_item_option import MenuItemOption
router = APIRouter(
    prefix="/customer/orders",
    tags=["Customer Orders"]
)
from app.routers.customer_cart import add_to_cart,AddCartItem
@router.post(
    "",
    response_model=OrderResponse
)
def create_order(
    data: CreateOrderRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # ----------------------------------------
    # 1. Find customer's cart
    # ----------------------------------------

    cart = db.exec(
        select(Cart).where(
            Cart.cart_id == data.cart_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    # ----------------------------------------
    # 2. Validate delivery address
    # ----------------------------------------

    customer_address = db.exec(
        select(CustomerAddress).where(
            CustomerAddress.address_id == data.address_id,
            CustomerAddress.customer_id == current_customer.customer_id
        )
    ).first()

    if customer_address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery address not found"
        )

    # Make sure customer address has coordinates
    if (
        customer_address.latitude is None
        or customer_address.longitude is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Delivery address does not have valid location coordinates"
        )

    # ----------------------------------------
    # 3. Get shop
    # ----------------------------------------

    shop = db.exec(
        select(Shop).where(
            Shop.shop_id == cart.shop_id,
            Shop.is_approved == True,
            Shop.is_active == True
        )
    ).first()

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    # Make sure shop has coordinates
    if (
        shop.latitude is None
        or shop.longitude is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop does not have valid location coordinates"
        )

    # ----------------------------------------
    # 4. Get cart items
    # ----------------------------------------

    cart_items = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place an order with an empty cart"
        )

    # ----------------------------------------
    # 5. Validate items and calculate cart total
    # ----------------------------------------

    cart_total = 0.0

    menu_items = {}
    priced_items = {}

    for cart_item in cart_items:

        menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == cart_item.menu_item_id,
            MenuItem.shop_id == cart.shop_id
        )
    ).first()

        if menu_item is None:
            raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

        if not menu_item.is_available:
            raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"{menu_item.name} is currently unavailable"
        )

        line = price_cart_item(
            db,
            cart_item,
            menu_item.price,
            now=now
        )

        cart_total += line.line_total

        menu_items[cart_item.menu_item_id] = menu_item
        priced_items[cart_item.cart_item_id] = line

    # ----------------------------------------
    # 6. Calculate delivery distance
    # ----------------------------------------

    try:

        delivery_distance = calculate_delivery_distance(
            shop.latitude,
            shop.longitude,
            customer_address.latitude,
            customer_address.longitude
        )

        delivery_fee = calculate_delivery_fee(
            delivery_distance
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    # ----------------------------------------
    # 7. Calculate final order total
    # ----------------------------------------

    total_amount = cart_total + delivery_fee

    # ----------------------------------------
    # 8. Create Order
    # ----------------------------------------

    order = Order(
        customer_id=current_customer.customer_id,
        shop_id=cart.shop_id,
        status=OrderStatus.PENDING,

        total_amount=total_amount,

        delivery_distance=delivery_distance,
        delivery_fee=delivery_fee,

        delivery_instruction=data.delivery_instruction
    )

    db.add(order)
    db.flush()

    # ----------------------------------------
    # 9. Create delivery address snapshot
    # ----------------------------------------

    delivery_address = OrderDeliveryAddress(
        order_id=order.order_id,
        address_line1=customer_address.address_line1,
        address_line2=customer_address.address_line2,
        city=customer_address.city,
        state=customer_address.state,
        pincode=customer_address.pincode
    )

    db.add(delivery_address)

    # ----------------------------------------
    # 10. Create OrderItems
# ----------------------------------------

    for cart_item in cart_items:

        menu_item = menu_items[cart_item.menu_item_id]
        line = priced_items[cart_item.cart_item_id]

        variants = [
        option.name
        for option in line.options
        if option.price_mode == "REPLACE"
        ]

        addons = [
        f"{option.name} ×{option.quantity}"
        for option in line.options
        if option.price_mode == "ADD"
        ]

        item_name = menu_item.name

        if variants:
            item_name += f" ({', '.join(variants)})"

        if addons:
            item_name += f" + {', '.join(addons)}"

        # ----------------------------------------
        # Create parent OrderItem
        # ----------------------------------------

        order_item = OrderItem(
        order_id=order.order_id,
        menu_item_id=menu_item.item_id,
        item_name=item_name,
        unit_price=line.unit_price,
        quantity=cart_item.quantity,
        subtotal=line.line_total,
        original_unit_price=line.original_unit_price,
        discount_amount=line.discount_total,
        offer_id=line.offer_id,
        offer_title=line.offer_title,
        )

        db.add(order_item)
        db.flush()

        # ----------------------------------------
        # Snapshot selected options
        # ----------------------------------------

        for option in line.options:

            option_subtotal = (
            option.price * option.quantity
            if option.price_mode == "ADD"
            else option.price * cart_item.quantity
        )

            order_item_option = OrderItemOption(
            order_item_id=order_item.order_item_id,
            option_id=option.option_id,
            option_name=option.name,
            unit_price=option.price,
            quantity=(
                option.quantity
                if option.price_mode == "ADD"
                else cart_item.quantity
            ),
            subtotal=option_subtotal,
        )

            db.add(order_item_option)

    # ----------------------------------------
    # 11. Remove cart items
    # ----------------------------------------

    # ----------------------------------------
# 11. Remove cart items
# ----------------------------------------

    for cart_item in cart_items:

    # Delete child option rows first
        cart_item_options = db.exec(
            select(CartItemOption).where(
            CartItemOption.cart_item_id == cart_item.cart_item_id
        )
    ).all()

        for cart_item_option in cart_item_options:
            db.delete(cart_item_option)
    db.flush()

    for cart_item in cart_items:
        db.delete(cart_item)

    db.flush()

# Remove the active cart
    db.delete(cart)

    # ----------------------------------------
    # 12. Commit everything
    # ----------------------------------------

    try:

        db.commit()

    except Exception:

        db.rollback()
        raise

    # ----------------------------------------
    # 13. Get created order items
    # ----------------------------------------

    order_items = db.exec(
        select(OrderItem).where(
            OrderItem.order_id == order.order_id
        )
    ).all()

    # ----------------------------------------
    # 14. Refresh objects
    # ----------------------------------------

    db.refresh(order)
    db.refresh(delivery_address)

    # ----------------------------------------
    # 15. Return response
    # ----------------------------------------

    return OrderResponse(
        order_id=order.order_id,

        customer_id=order.customer_id,

        shop_id=order.shop_id,

        shop_name=shop.shop_name,

        status=order.status,

        total_amount=order.total_amount,

        delivery_distance=order.delivery_distance,

        delivery_fee=order.delivery_fee,

        created_at=order.created_at,

        delivery_instruction=order.delivery_instruction,

        delivery_address=OrderDeliveryAddressResponse(
            delivery_address_id=delivery_address.delivery_address_id,

            order_id=delivery_address.order_id,

            address_line1=delivery_address.address_line1,

            address_line2=delivery_address.address_line2,

            city=delivery_address.city,

            state=delivery_address.state,

            pincode=delivery_address.pincode
        ),

        items=[
    OrderItemResponse(
        order_item_id=item.order_item_id,

        menu_item_id=item.menu_item_id,

        item_name=item.item_name,

        unit_price=item.unit_price,

        quantity=item.quantity,

        subtotal=item.subtotal,

        original_unit_price=item.original_unit_price,

        discount_amount=item.discount_amount,

        offer_id=item.offer_id,

        offer_title=item.offer_title,
    )

    for item in order_items
]
    )
@router.get(
    "",
    response_model=list[OrderResponse]
)
def get_customer_orders(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    orders = db.exec(
        select(Order).where(
            Order.customer_id == current_customer.customer_id
        ).order_by(desc(Order.created_at))
    ).all()

    response = []

    for order in orders:

        order_items = db.exec(
            select(OrderItem).where(
                OrderItem.order_id == order.order_id
            )
        ).all()

        shop = db.get(
            Shop,
            order.shop_id
        )

        if shop is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="shop not found"
            )

        delivery_address = db.exec(
            select(OrderDeliveryAddress).where(
                OrderDeliveryAddress.order_id == order.order_id
            )
        ).first()

        if delivery_address is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery address not found for order"
            )

        response.append(
            OrderResponse(
                order_id=order.order_id,
                customer_id=order.customer_id,
                shop_id=order.shop_id,
                shop_name=shop.shop_name,
                status=order.status,
                total_amount=order.total_amount,
                created_at=order.created_at,
                delivery_instruction=order.delivery_instruction,
                delivery_distance=order.delivery_distance,
                delivery_fee=order.delivery_fee,

                delivery_address=OrderDeliveryAddressResponse(
                    delivery_address_id=delivery_address.delivery_address_id,
                    order_id=delivery_address.order_id,
                    address_line1=delivery_address.address_line1,
                    address_line2=delivery_address.address_line2,
                    city=delivery_address.city,
                    state=delivery_address.state,
                    pincode=delivery_address.pincode
                ),

                items=[
                    OrderItemResponse(
                        order_item_id=item.order_item_id,
                        menu_item_id=item.menu_item_id,
                        item_name=item.item_name,
                        unit_price=item.unit_price,
                        quantity=item.quantity,
                        subtotal=item.subtotal
                    )
                    for item in order_items
                ]
            )
        )

    return response

@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_customer_order(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # Find the customer's order
    order = db.exec(
        select(Order).where(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
    ).first()

    shop = db.get(
        Shop,
        order.shop_id
    )

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SHOP name not found"
        )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Get order items
    order_items = db.exec(
        select(OrderItem).where(
            OrderItem.order_id == order.order_id
        )
    ).all()

    # Get delivery-address snapshot
    delivery_address = db.exec(
        select(OrderDeliveryAddress).where(
            OrderDeliveryAddress.order_id == order.order_id
        )
    ).first()

    if delivery_address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery address not found for order"
        )

    return OrderResponse(
        order_id=order.order_id,
        customer_id=order.customer_id,
        shop_id=order.shop_id,
        shop_name=shop.shop_name,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        delivery_instruction=order.delivery_instruction,
        delivery_distance=order.delivery_distance,
        delivery_fee=order.delivery_fee,

        delivery_address=OrderDeliveryAddressResponse(
            delivery_address_id=delivery_address.delivery_address_id,
            order_id=delivery_address.order_id,
            address_line1=delivery_address.address_line1,
            address_line2=delivery_address.address_line2,
            city=delivery_address.city,
            state=delivery_address.state,
            pincode=delivery_address.pincode
        ),

        items=[
            OrderItemResponse(
                order_item_id=item.order_item_id,
                menu_item_id=item.menu_item_id,
                item_name=item.item_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            for item in order_items
        ]
    )

@router.post("/{order_id}/reorder/validate")
def validate_reorder(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # ----------------------------------------
    # 1. Find customer's order
    # ----------------------------------------

    order = db.exec(
        select(Order).where(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # ----------------------------------------
    # 2. Check shop
    # ----------------------------------------

    shop = db.exec(
        select(Shop).where(
            Shop.shop_id == order.shop_id,
            Shop.is_approved == True,
            Shop.is_active == True
        )
    ).first()

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant is currently unavailable"
        )

    # ----------------------------------------
    # 3. Get order items
    # ----------------------------------------

    order_items = db.exec(
        select(OrderItem).where(
            OrderItem.order_id == order.order_id
        )
    ).all()

    if not order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order has no items to reorder"
        )

    available_items = []
    unavailable_items = []

    # ----------------------------------------
    # 4. Validate every ordered item
    # ----------------------------------------

    for order_item in order_items:

        menu_item = db.exec(
            select(MenuItem).where(
                MenuItem.item_id == order_item.menu_item_id,
                MenuItem.shop_id == order.shop_id
            )
        ).first()

        # Item deleted
        if menu_item is None:
            unavailable_items.append({
                "order_item_id": order_item.order_item_id,
                "menu_item_id": order_item.menu_item_id,
                "name": order_item.item_name,
                "reason": "Item is no longer available"
            })
            continue

        # Item disabled
        if not menu_item.is_available:
            unavailable_items.append({
                "order_item_id": order_item.order_item_id,
                "menu_item_id": menu_item.item_id,
                "name": menu_item.name,
                "reason": "Item is currently unavailable"
            })
            continue

        # ----------------------------------------
        # 5. Check saved options
        # ----------------------------------------

        saved_options = db.exec(
            select(OrderItemOption).where(
                OrderItemOption.order_item_id ==
                order_item.order_item_id
            )
        ).all()

        configuration_valid = True
        configuration_reason = None
        option_results = []

        for saved_option in saved_options:

            current_option = db.get(
                MenuItemOption,
                saved_option.option_id
            )

            # Option deleted
            if current_option is None:
                configuration_valid = False
                configuration_reason = (
                    f"{saved_option.option_name} is no longer available"
                )
                break

            # Option disabled
            if not current_option.is_available:
                configuration_valid = False
                configuration_reason = (
                    f"{saved_option.option_name} is currently unavailable"
                )
                break

            # ----------------------------------------
            # Check option's group
            # ----------------------------------------

            current_group = db.get(
                MenuItemOptionGroup,
                current_option.group_id
            )

            if current_group is None:
                configuration_valid = False
                configuration_reason = (
                    f"{saved_option.option_name} configuration "
                    "is no longer available"
                )
                break

            # Group disabled
            if not current_group.is_active:
                configuration_valid = False
                configuration_reason = (
                    f"{current_group.name} is currently unavailable"
                )
                break

            # ----------------------------------------
            # Make sure option still belongs to
            # this menu item
            # ----------------------------------------

            if current_group.menu_item_id != menu_item.item_id:
                configuration_valid = False
                configuration_reason = (
                    f"{saved_option.option_name} is no longer "
                    "part of this item"
                )
                break

            # ----------------------------------------
            # Check current option price
            # ----------------------------------------

            option_price_changed = (
                float(saved_option.unit_price)
                != float(current_option.price)
            )

            option_results.append({
                "option_id": saved_option.option_id,
                "name": current_option.name,
                "ordered_quantity": saved_option.quantity,
                "old_price": saved_option.unit_price,
                "current_price": current_option.price,
                "price_changed": option_price_changed,
                "price_mode": current_group.price_mode
            })

        # ----------------------------------------
        # Configuration invalid
        # ----------------------------------------

        if not configuration_valid:
            unavailable_items.append({
                "order_item_id": order_item.order_item_id,
                "menu_item_id": menu_item.item_id,
                "name": menu_item.name,
                "reason": configuration_reason
            })
            continue

        # ----------------------------------------
        # 6. Parent item price
        # ----------------------------------------

        item_price_changed = (
            float(order_item.unit_price)
            != float(menu_item.price)
        )

        # ----------------------------------------
        # 7. Check required option groups
        # ----------------------------------------

        if menu_item.has_options:

            active_groups = db.exec(
                select(MenuItemOptionGroup).where(
                    MenuItemOptionGroup.menu_item_id ==
                    menu_item.item_id,
                    MenuItemOptionGroup.is_active == True
                )
            ).all()

            saved_option_ids = {
                option.option_id
                for option in saved_options
                if option.option_id is not None
            }

            for group in active_groups:

                group_options = db.exec(
                    select(MenuItemOption).where(
                        MenuItemOption.group_id == group.group_id,
                        MenuItemOption.is_available == True
                    )
                ).all()

                selected_count = sum(
                    1
                    for option in group_options
                    if option.option_id in saved_option_ids
                )

                if group.required and selected_count == 0:

                    # If the parent item itself can be purchased,
                    # an empty option selection can still be valid.
                    if not menu_item.allow_parent_purchase:
                        configuration_valid = False
                        configuration_reason = (
                            f"{group.name} requires a selection"
                        )
                        break

                if (
                    group.min_selection is not None
                    and selected_count < group.min_selection
                ):
                    configuration_valid = False
                    configuration_reason = (
                        f"{group.name} requires at least "
                        f"{group.min_selection} selection(s)"
                    )
                    break

                if (
                    group.max_selection is not None
                    and selected_count > group.max_selection
                ):
                    configuration_valid = False
                    configuration_reason = (
                        f"{group.name} allows at most "
                        f"{group.max_selection} selection(s)"
                    )
                    break

            if not configuration_valid:
                unavailable_items.append({
                    "order_item_id": order_item.order_item_id,
                    "menu_item_id": menu_item.item_id,
                    "name": menu_item.name,
                    "reason": configuration_reason
                })
                continue

        # ----------------------------------------
        # 8. Item is reorderable
        # ----------------------------------------

        available_items.append({
            "order_item_id": order_item.order_item_id,
            "menu_item_id": menu_item.item_id,
            "name": menu_item.name,
            "ordered_quantity": order_item.quantity,

            "old_price": order_item.unit_price,
            "current_price": menu_item.price,
            "price_changed": item_price_changed,

            "configuration_valid": True,
            "options": option_results
        })

    # ----------------------------------------
    # 9. Final result
    # ----------------------------------------

    return {
        "order_id": order.order_id,
        "shop_id": shop.shop_id,
        "shop_name": shop.shop_name,

        "can_reorder": len(available_items) > 0,

        "available_items": available_items,
        "unavailable_items": unavailable_items
    }


@router.post("/{order_id}/reorder")
def reorder_order(
    order_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # ----------------------------------------
    # 1. Find customer's order
    # ----------------------------------------

    order = db.exec(
        select(Order).where(
            Order.order_id == order_id,
            Order.customer_id == current_customer.customer_id
        )
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # ----------------------------------------
    # 2. Validate reorder first
    # ----------------------------------------

    validation = validate_reorder(
        order_id=order_id,
        current_customer=current_customer,
        db=db
    )

    if not validation["can_reorder"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "None of the items can be reordered",
                "unavailable_items": validation["unavailable_items"]
            }
        )

    # ----------------------------------------
    # 3. Add available items to cart
    # ----------------------------------------

    added_items = []
    skipped_items = []

    for item in validation["available_items"]:

        option_ids = [
            option["option_id"]
            for option in item["options"]
            if option.get("option_id") is not None
        ]

        option_quantities = {
            option["option_id"]: option["ordered_quantity"]
            for option in item["options"]
            if option.get("option_id") is not None
        }

        try:

            result = add_to_cart(
                data=AddCartItem(
                    menu_item_id=item["menu_item_id"],
                    quantity=item["ordered_quantity"],
                    option_ids=option_ids,
                    option_quantities=option_quantities
                ),
                current_customer=current_customer,
                db=db
            )

            added_items.append({
                "order_item_id": item["order_item_id"],
                "menu_item_id": item["menu_item_id"],
                "name": item["name"],
                "quantity": item["ordered_quantity"],
                "option_ids": option_ids,
                "cart_item_id": result["cart_item_id"]
            })

        except HTTPException as error:

            skipped_items.append({
                "order_item_id": item["order_item_id"],
                "menu_item_id": item["menu_item_id"],
                "name": item["name"],
                "reason": error.detail
            })

    # ----------------------------------------
    # 4. Final response
    # ----------------------------------------

    return {
        "message": "Reorder completed",
        "order_id": order.order_id,
        "shop_id": order.shop_id,
        "shop_name": validation["shop_name"],
        "added_items": added_items,
        "skipped_items": [
            *validation["unavailable_items"],
            *skipped_items
        ],
        "cart_ready": len(added_items) > 0
    }