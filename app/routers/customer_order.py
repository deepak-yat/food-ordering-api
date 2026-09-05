from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select


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
from app.schemas.order import (
    CreateOrderRequest,
    OrderResponse,
    OrderItemResponse,
    OrderDeliveryAddressResponse
)


router = APIRouter(
    prefix="/customer/orders",
    tags=["Customer Orders"]
)

@router.post(
    "",
    response_model=OrderResponse
)
def create_order(
    data: CreateOrderRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
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

    # ----------------------------------------
    # 3. Get cart items
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
    # 4. Validate items and calculate total
    # ----------------------------------------

    total_amount = 0.0

    menu_items = {}

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

        subtotal = menu_item.price * cart_item.quantity

        total_amount += subtotal

        menu_items[cart_item.menu_item_id] = menu_item

    # ----------------------------------------
    # 5. Create Order
    # ----------------------------------------

    order = Order(
        customer_id=current_customer.customer_id,
        shop_id=cart.shop_id,
        status=OrderStatus.PENDING,
        total_amount=total_amount,
        delivery_instruction=data.delivery_instruction
    )

    db.add(order)
    db.flush()

    # ----------------------------------------
    # 6. Create delivery address snapshot
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
    # 7. Create OrderItems
    # ----------------------------------------

    for cart_item in cart_items:

        menu_item = menu_items[cart_item.menu_item_id]

        subtotal = (
            menu_item.price *
            cart_item.quantity
        )

        order_item = OrderItem(
            order_id=order.order_id,
            menu_item_id=menu_item.item_id,
            item_name=menu_item.name,
            unit_price=menu_item.price,
            quantity=cart_item.quantity,
            subtotal=subtotal
        )

        db.add(order_item)

    # ----------------------------------------
# 8. Remove cart items
# ----------------------------------------

    for cart_item in cart_items:
        db.delete(cart_item)

    db.flush()

# Cart is now empty, so remove the active cart itself.
    db.delete(cart)

# ----------------------------------------
# 9. Commit everything
# ----------------------------------------

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    # ----------------------------------------
    # 10. Get created order items
    # ----------------------------------------

    order_items = db.exec(
        select(OrderItem).where(
            OrderItem.order_id == order.order_id
        )
    ).all()
#GET SHOP
    shop = db.get(
        Shop,
        order.shop_id
    )

    if shop is None:
        raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Shop not found"
    )
    # ----------------------------------------
    # 11. Return response
    # ----------------------------------------

    return OrderResponse(
        order_id=order.order_id,
        customer_id=order.customer_id,
        shop_id=order.shop_id,
        shop_name=shop.shop_name,
        status=order.status,
        total_amount=order.total_amount,
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
                subtotal=item.subtotal
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
        )
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