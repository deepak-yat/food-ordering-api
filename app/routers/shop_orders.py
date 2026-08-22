from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_shop
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.shop import Shop
from app.schemas.order import (
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

        response.append(
            ShopOrderResponse(
                order_id=order.order_id,
                customer_id=order.customer_id,
                shop_id=order.shop_id,
                status=order.status,
                total_amount=order.total_amount,
                created_at=order.created_at,
                items=items
            )
        )

    return response