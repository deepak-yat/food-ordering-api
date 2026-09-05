from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus

class CreateOrderRequest(BaseModel):
    cart_id: int
    address_id: int
    delivery_instruction: str | None = None


class OrderItemResponse(BaseModel):
    order_item_id: int
    menu_item_id: int
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float

class OrderDeliveryAddressResponse(BaseModel):
    delivery_address_id: int
    order_id: int
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    pincode: str


class OrderResponse(BaseModel):
    order_id: int
    customer_id: int
    shop_id: int
    shop_name : str
    status: OrderStatus
    total_amount: float
    created_at: datetime
    delivery_instruction: str | None
    delivery_address: OrderDeliveryAddressResponse
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
    customer_name: str
    customer_phone: str | None

    shop_id: int

    status: OrderStatus
    total_amount: float
    created_at: datetime

    delivery_instruction: str | None
    delivery_address: OrderDeliveryAddressResponse

    items: list[ShopOrderItemResponse]

class ShopOrderStatusUpdate(BaseModel):
    status: OrderStatus