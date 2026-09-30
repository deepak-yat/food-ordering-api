from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from datetime import datetime, timezone
from math import ceil
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.customer import Customer
from app.models.notification import Notification, NotificationType
from app.models.order import Order
from app.models.shop import Shop
from app.schemas.notification import (
    NotificationResponse,
    UnreadCountResponse,
    NotificationListResponse,
)

router = APIRouter(
    prefix="/customer/notifications",
    tags=["Customer Interactions"],
)



@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    count = db.exec(
        select(Notification)
        .where(
            Notification.customer_id == current_customer.customer_id,
            Notification.is_read == False,
        )
    ).all()

    return {
        "count": len(count)
    }

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    notification = db.exec(
        select(Notification).where(
            Notification.notification_id == notification_id,
            Notification.customer_id == current_customer.customer_id,
        )
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

        db.add(notification)
        db.commit()
        db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification_id": notification.notification_id,
        "is_read": notification.is_read,
    }

@router.patch("/read-all")
def mark_all_notifications_as_read(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    notifications = db.exec(
        select(Notification).where(
            Notification.customer_id == current_customer.customer_id,
            Notification.is_read == False,
        )
    ).all()

    now = datetime.now(timezone.utc)

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now
        db.add(notification)

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": len(notifications),
    }

@router.get("", response_model=NotificationListResponse)
def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    total = db.exec(
        select(func.count(Notification.notification_id)).where(
            Notification.customer_id == current_customer.customer_id
        )
    ).one()

    offset = (page - 1) * page_size

    rows = db.exec(
        select(
            Notification,
            Shop.shop_name,
            Shop.image_url,
        )
        .join(
            Order,
            Order.order_id == Notification.order_id,
            isouter=True,
        )
        .join(
            Shop,
            Shop.shop_id == Order.shop_id,
            isouter=True,
        )
        .where(
            Notification.customer_id == current_customer.customer_id
        )
        .order_by(Notification.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    items = [
        NotificationResponse(
            notification_id=notification.notification_id,
            order_id=notification.order_id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            is_read=notification.is_read,
            created_at=notification.created_at,
            shop_name=shop_name,
            shop_image_url=image_url,
        )
        for notification, shop_name, image_url in rows
    ]

    counts = {
        "ALL": total,

        "ORDER_STATUS": db.exec(
            select(func.count(Notification.notification_id)).where(
                Notification.customer_id == current_customer.customer_id,
                Notification.notification_type == NotificationType.ORDER_STATUS,
            )
        ).one(),

        "OFFER": db.exec(
            select(func.count(Notification.notification_id)).where(
                Notification.customer_id == current_customer.customer_id,
                Notification.notification_type == NotificationType.OFFER,
            )
        ).one(),

        "SYSTEM": db.exec(
            select(func.count(Notification.notification_id)).where(
                Notification.customer_id == current_customer.customer_id,
                Notification.notification_type == NotificationType.SYSTEM,
            )
        ).one(),
    }

    total_pages = ceil(total / page_size) if total else 0

    return NotificationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        counts=counts,
    )