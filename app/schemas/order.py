from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus


class CreateOrderRequest(BaseModel):
    cart_id: int


class OrderItemResponse(BaseModel):
    order_item_id: int
    menu_item_id: int
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float


class OrderResponse(BaseModel):
    order_id: int
    customer_id: int
    shop_id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    items: list[OrderItemResponse]


class ShopOrderItemResponse(BaseModel):
    order_item_id: int
    menu_item_id: int
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float


class ShopOrderResponse(BaseModel):
    order_id: int
    customer_id: int
    shop_id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    items: list[ShopOrderItemResponse]