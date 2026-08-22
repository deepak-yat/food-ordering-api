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

from app.schemas.order import (
    CreateOrderRequest,
    OrderResponse,
    OrderItemResponse
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
    data:CreateOrderRequest,
    current_customer: Customer = Depends(get_current_customer),
    db : Session = Depends(get_db)
):
    cart = db.exec(
        select(Cart).where(
            Cart.cart_id==data.cart_id,
            Cart.customer_id==current_customer.customer_id
        )
    ).first()
    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="cart not found"
        )
    cart_items=db.exec(
        select(CartItem).where(
            CartItem.cart_id==cart.cart_id,
        )
    ).all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot place an order with an empty cart"
    )
    total_amount = 0.0
    for cart_item in cart_items:
        menu_item=db.exec(
            select(MenuItem).where(
                MenuItem.item_id==cart_item.menu_item_id,
                MenuItem.shop_id==cart.shop_id
            )
        ).first()
        if menu_item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="item not found"
            )
        if not menu_item.is_available:
            raise HTTPException (
                status_code=status.HTTP_410_GONE,
                detail=f"{menu_item.name} is currently unavailable"
            )
        sub_total=menu_item.price * cart_item.quantity

        total_amount+=sub_total

    order=Order(
            customer_id=current_customer.customer_id,
            shop_id=cart.shop_id,
            status=OrderStatus.PENDING,
            total_amount=total_amount
        )

    db.add(order)
    db.flush()

    for cart_item in cart_items:

        menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == cart_item.menu_item_id,
            MenuItem.shop_id == cart.shop_id
        )
        ).first()

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

    for cart_item in cart_items:
        db.delete(cart_item)

    db.commit()
    db.refresh(order)

    order_items = db.exec(
    select(OrderItem).where(
        OrderItem.order_id == order.order_id
    )
        ).all()
    
    return OrderResponse(
    order_id=order.order_id,
    customer_id=order.customer_id,
    shop_id=order.shop_id,
    status=order.status,
    total_amount=order.total_amount,
    created_at=order.created_at,
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
    