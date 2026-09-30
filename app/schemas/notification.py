from datetime import datetime

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    notification_id: int
    order_id: int | None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime
    shop_name: str | None
    shop_image_url: str | None


class UnreadCountResponse(BaseModel):
    count: int

class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    counts: dict[str, int]