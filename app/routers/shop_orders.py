from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_shop, get_current_kitchen_staff_user
from datetime import datetime, timezone

from app.models.kitchen_staff import KitchenStaff
from app.models.kitchen_staff_attendance import (
    KitchenStaffAttendance,
    AttendanceStatus
)
from app.models.customer import Customer
from app.models.order import Order,OrderStatus
from app.models.order_delivery_address import OrderDeliveryAddress
from app.models.order_item import OrderItem
from app.models.shop import Shop
from app.models.user import User

from app.schemas.order import (
    OrderDeliveryAddressResponse,
    ShopOrderItemResponse,
    ShopOrderResponse,
    ShopOrderStatusUpdate
)
from app.models.notification import Notification, NotificationType
from app.services.order_notifications import STATUS_INFO


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
                items=items
            )
        )

    return response

@router.put(
    "/{order_id}/status"
)
def update_shop_order_status(
    order_id: int,
    data: ShopOrderStatusUpdate,
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    order = db.exec(
        select(Order).where(
            Order.order_id == order_id,
            Order.shop_id == current_shop.shop_id
        )
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    current_status = order.status
    new_status = data.status

    allowed_transitions = {
        OrderStatus.PENDING: {
            OrderStatus.ACCEPTED,
            OrderStatus.REJECTED,
        },
        OrderStatus.ACCEPTED: set(),
        OrderStatus.PREPARING: {
            OrderStatus.READY,
        },
        OrderStatus.READY: {
            OrderStatus.COMPLETED,
        },
    }

    allowed_statuses = allowed_transitions.get(
        current_status,
        set()
    )
    if (
    current_status == OrderStatus.PREPARING
    and new_status == OrderStatus.READY
    ):
        if order.assigned_kitchen_staff_id is None:
            raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order has not been assigned to a kitchen staff member"
                )

        if order.kitchen_ready_at is None:
            raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kitchen has not marked this order as ready"
            )
        
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot change order status "
                f"from {current_status} to {new_status}"
            )
        )

    order.status = new_status
    db.add(order)

    info = STATUS_INFO.get(new_status)

    if info and info["notify"]:
        db.add(
            Notification(
                customer_id=order.customer_id,
                order_id=order.order_id,
                title=info["title"],
                message=info["message"].format(
                    shop_name=current_shop.shop_name
                ),
                notification_type=NotificationType.ORDER_STATUS,
            )
        )

    db.commit()
    db.refresh(order)

    return {
        "message": "Order status updated successfully",
        "order_id": order.order_id,
        "status": order.status,
    }

@router.put(
    "/{order_id}/start-preparing"
)
def start_kitchen_order(
    order_id: int,
    current_staff: KitchenStaff = Depends(
        get_current_kitchen_staff_user
    ),
    db: Session = Depends(get_db)
):
    # Get the kitchen staff's user account
    user = db.get(User, current_staff.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kitchen staff user account not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff account is inactive"
        )

    # Get today's attendance
    today = datetime.now(timezone.utc).date()

    attendance = db.exec(
        select(KitchenStaffAttendance).where(
            KitchenStaffAttendance.staff_id == current_staff.staff_id,
            KitchenStaffAttendance.attendance_date == today
        )
    ).first()

    if attendance is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff has not logged in today"
        )

    if attendance.status == AttendanceStatus.ON_LEAVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff is on leave"
        )

    if attendance.logout_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kitchen staff is currently offline"
        )

    # Make sure this chef isn't already preparing another order
    existing_order = db.exec(
        select(Order).where(
            Order.assigned_kitchen_staff_id == current_staff.staff_id,
            Order.status == OrderStatus.PREPARING,
            Order.kitchen_ready_at.is_(None)
        )
    ).first()

    if existing_order is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Kitchen staff is already preparing "
                f"order #{existing_order.order_id}"
            )
        )

    # Get the order belonging to this shop
    order = db.exec(
        select(Order).where(
            Order.order_id == order_id,
            Order.shop_id == user.shop_id
        )
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Re-check the current status immediately before mutation
    if order.status != OrderStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Order cannot be started because its current "
                f"status is {order.status}"
            )
        )

    # Make sure another chef hasn't claimed it
    if order.assigned_kitchen_staff_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order has already been assigned to another chef"
        )

    now = datetime.now(timezone.utc)

    order.assigned_kitchen_staff_id = current_staff.staff_id
    order.status = OrderStatus.PREPARING
    order.preparation_started_at = now
    order.kitchen_ready_at = None

    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order assigned and preparation started",
        "order_id": order.order_id,
        "status": order.status,
        "assigned_kitchen_staff_id": order.assigned_kitchen_staff_id,
        "preparation_started_at": order.preparation_started_at
    }

@router.put("/{order_id}/kitchen-ready")
def mark_kitchen_ready(
    order_id: int,
    current_staff: KitchenStaff = Depends(
        get_current_kitchen_staff_user
    ),
    db: Session = Depends(get_db)
):
    order = db.exec(
        select(Order).where(
            Order.order_id == order_id
        )
    ).first()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Make sure the order belongs to the chef's shop
    user = db.get(User, current_staff.user_id)

    if user is None or user.shop_id != order.shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this order"
        )

    # Re-check current status before changing anything
    if order.status != OrderStatus.PREPARING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Order cannot be marked kitchen-ready "
                f"because its current status is {order.status}"
            )
        )

    # Only the chef who claimed the order can mark it ready
    if order.assigned_kitchen_staff_id != current_staff.staff_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This order is assigned to another chef"
        )

    # Prevent duplicate completion
    if order.kitchen_ready_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order is already marked kitchen-ready"
        )

    order.kitchen_ready_at = datetime.now(timezone.utc)

    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order marked as kitchen-ready",
        "order_id": order.order_id,
        "status": order.status,
        "assigned_kitchen_staff_id": order.assigned_kitchen_staff_id,
        "kitchen_ready_at": order.kitchen_ready_at
    }