from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_shop

from app.models.customer import Customer
from app.models.order import Order
from app.models.order_delivery_address import OrderDeliveryAddress
from app.models.order_item import OrderItem
from app.models.shop import Shop
from app.models.user import User

from app.schemas.order import (
    OrderDeliveryAddressResponse,
    ShopOrderItemResponse,
    ShopOrderResponse,
)
router = APIRouter(
    prefix="/shop/orders",
    tags=["Shop Orders"]
)


@router.get(
    "",
    response_model=list[ShopOrderResponse]
)
def get_shop_orders(
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    orders = db.exec(
        select(Order).where(
            Order.shop_id == current_shop.shop_id
        )
    ).all()

    response = []

    for order in orders:

        customer = db.exec(
            select(Customer).where(
                Customer.customer_id == order.customer_id
            )
        ).first()

        if customer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )

        order_items = db.exec(
            select(OrderItem).where(
                OrderItem.order_id == order.order_id
            )
        ).all()

        items = [
            ShopOrderItemResponse(
                order_item_id=item.order_item_id,
                menu_item_id=item.menu_item_id,
                item_name=item.item_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal
            )
            for item in order_items
        ]

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
            ShopOrderResponse(
                order_id=order.order_id,
                customer_id=customer.customer_id,
                customer_name=customer.customer_name,
                customer_phone=customer.phone,
                shop_id=order.shop_id,
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
                items=items
            )
        )

    return response