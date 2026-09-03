from datetime import datetime, timezone
from enum import Enum
import sqlalchemy as sa
from sqlmodel import SQLModel, Field


class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    order_id: int | None = Field(
        default=None,
        primary_key=True
    )

    customer_id: int = Field(
        foreign_key="customers.customer_id",
        index=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    status: OrderStatus = Field(
    default=OrderStatus.PENDING,
    sa_type=sa.Enum(
        OrderStatus,
        name="orderstatus",
        values_callable=lambda enum_cls: [
            member.value for member in enum_cls
        ]
    )
)

    total_amount: float

    delivery_instruction: str | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )