from datetime import datetime, timezone
from enum import Enum

import sqlalchemy as sa
from sqlmodel import SQLModel, Field


class NotificationType(str, Enum):
    ORDER_STATUS = "ORDER_STATUS"
    OFFER = "OFFER"
    SYSTEM = "SYSTEM"


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    notification_id: int | None = Field(
        default=None,
        primary_key=True
    )

    customer_id: int = Field(
        foreign_key="customers.customer_id",
        index=True
    )

    order_id: int | None = Field(
        default=None,
        foreign_key="orders.order_id",
        index=True
    )

    title: str

    message: str

    notification_type: NotificationType = Field(
        default=NotificationType.ORDER_STATUS,
        sa_type=sa.Enum(
            NotificationType,
            name="notificationtype",
            values_callable=lambda e: [member.value for member in e]
        )
    )

    is_read: bool = False

    read_at: datetime | None = Field(
        default=None,
        sa_column=sa.Column(
            sa.DateTime(timezone=True)
        )
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False
        )
    )