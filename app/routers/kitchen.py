from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from datetime import date, datetime, timezone

from app.database import get_db
from app.dependencies import get_current_kitchen_staff_user

from app.models.kitchen_staff import KitchenStaff
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.user import User
from app.models.customer import Customer

from app.models.kitchen_staff_attendance import (
    KitchenStaffAttendance,
    AttendanceStatus,
)
router = APIRouter(
    prefix="/kitchen",
    tags=["Kitchen"]
)


@router.get("/orders")
def get_kitchen_orders(
    current_staff: KitchenStaff = Depends(
        get_current_kitchen_staff_user
    ),
    db: Session = Depends(get_db)
):
    # Get the user linked to the kitchen staff
    user = db.get(User, current_staff.user_id)

    if user is None or user.shop_id is None:
        return {
            "new": [],
            "preparing": [],
            "ready": [],
            "completed": []
        }

    # Get all relevant orders for this kitchen's shop.
    # created_at ASC gives FIFO ordering.
    orders = db.exec(
        select(Order)
        .where(
            Order.shop_id == user.shop_id,
            Order.status.in_([
                OrderStatus.ACCEPTED,
                OrderStatus.PREPARING,
                OrderStatus.COMPLETED,
            ])
        )
        .order_by(Order.created_at.asc())
    ).all()

    new_orders = []
    preparing_orders = []
    ready_orders = []
    completed_orders = []

    for order in orders:

        # -----------------------------------------
        # Get order items
        # -----------------------------------------
        order_items = db.exec(
            select(OrderItem).where(
                OrderItem.order_id == order.order_id
            )
        ).all()

        items = [
            {
                "order_item_id": item.order_item_id,
                "menu_item_id": item.menu_item_id,
                "item_name": item.item_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order_items
        ]

        # -----------------------------------------
        # Get customer
        # -----------------------------------------
        customer = db.exec(
            select(Customer).where(
                Customer.customer_id == order.customer_id
            )
        ).first()

        # -----------------------------------------
        # Get assigned kitchen staff
        # -----------------------------------------
        assigned_staff_name = None

        if order.assigned_kitchen_staff_id is not None:

            assigned_staff = db.get(
                KitchenStaff,
                order.assigned_kitchen_staff_id
            )

            if assigned_staff:
                assigned_staff_name = assigned_staff.full_name

        # -----------------------------------------
        # Prepare order response
        # -----------------------------------------
        order_data = {
            "order_id": order.order_id,

            "customer_id": order.customer_id,

            "customer_name": (
                customer.customer_name
                if customer
                else None
            ),

            "status": order.status,

            "total_amount": order.total_amount,

            "created_at": order.created_at,

            "assigned_kitchen_staff_id": (
                order.assigned_kitchen_staff_id
            ),

            "assigned_kitchen_staff_name": (
                assigned_staff_name
            ),

            "preparation_started_at": (
                order.preparation_started_at
            ),

            "kitchen_ready_at": (
                order.kitchen_ready_at
            ),

            "items": items,
        }

        # -----------------------------------------
        # Separate orders into kitchen queues
        # -----------------------------------------

        # NEW
        # ACCEPTED orders waiting for a chef
        if order.status == OrderStatus.ACCEPTED:

            new_orders.append(order_data)

        # PREPARING / READY
        elif order.status == OrderStatus.PREPARING:

            # Kitchen has not finished the order yet
            if order.kitchen_ready_at is None:

                preparing_orders.append(order_data)

            # Kitchen has finished it internally,
            # waiting for manager validation
            else:

                ready_orders.append(order_data)

        # COMPLETED
        elif order.status == OrderStatus.COMPLETED:

            completed_orders.append(order_data)

    # -----------------------------------------
    # Return Kanban queues
    # -----------------------------------------
    return {
        "new": new_orders,
        "preparing": preparing_orders,
        "ready": ready_orders,
        "completed": completed_orders,
    }

@router.get("/staff")
def get_kitchen_staff(
    current_staff: KitchenStaff = Depends(
        get_current_kitchen_staff_user
    ),
    db: Session = Depends(get_db)
):
    user = db.get(User, current_staff.user_id)

    if user is None or user.shop_id is None:
        return []

    staff_members = db.exec(
        select(KitchenStaff)
        .join(
            User,
            User.user_id == KitchenStaff.user_id
        )
        .where(
            User.shop_id == user.shop_id,
            User.is_active == True
        )
        .order_by(KitchenStaff.full_name.asc())
    ).all()

    today = datetime.now(timezone.utc).date()

    response = []

    for staff in staff_members:

        attendance = db.exec(
            select(KitchenStaffAttendance)
            .where(
                KitchenStaffAttendance.staff_id == staff.staff_id,
                KitchenStaffAttendance.attendance_date == today
            )
        ).first()

        current_order = db.exec(
            select(Order)
            .where(
                Order.assigned_kitchen_staff_id == staff.staff_id,
                Order.status == OrderStatus.PREPARING,
                Order.kitchen_ready_at.is_(None)
            )
            .order_by(Order.created_at.asc())
        ).first()

        if attendance is None:
            attendance_status = "not_logged_in"
            is_online = False

        elif attendance.status == AttendanceStatus.ON_LEAVE:
            attendance_status = "on_leave"
            is_online = False

        elif attendance.logout_at is not None:
            attendance_status = "offline"
            is_online = False

        elif current_order is not None:
            attendance_status = "preparing"
            is_online = True

        else:
            attendance_status = "idle"
            is_online = True

        response.append({
            "staff_id": staff.staff_id,
            "full_name": staff.full_name,
            "phone_number": staff.phone_number,
            "is_active": True,
            "attendance_status": attendance_status,
            "is_online": is_online,
            "current_order_id": (
                current_order.order_id
                if current_order
                else None
            ),
            "current_order_status": (
                current_order.status
                if current_order
                else None
            ),
        })

    return response