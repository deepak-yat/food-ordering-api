from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSON

class DeliveryStatus(str, Enum):
    PENDING_OFFER = "PENDING_OFFER"
    OFFERED = "OFFERED"
    ASSIGNED = "ASSIGNED"
    ARRIVED_AT_SHOP = "ARRIVED_AT_SHOP"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    ARRIVED_AT_CUSTOMER = "ARRIVED_AT_CUSTOMER"
    DELIVERED = "DELIVERED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class Delivery(SQLModel, table=True):
    __tablename__ = "deliveries"

    delivery_id: int | None = Field(
        default=None,
        primary_key=True,
    )

    order_id: int = Field(
        foreign_key="orders.order_id",
        unique=True,
        index=True,
    )

    delivery_partner_id: int | None = Field(
        default=None,
        foreign_key="delivery_partners.partner_id",
        index=True,
    )

    status: DeliveryStatus = Field(
        default=DeliveryStatus.PENDING_OFFER,
    )

    distance_km: float | None = None

    customer_fee: float | None = None
    partner_earning: float | None = None
    platform_fee: float | None = None

    offer_expires_at: datetime | None = None
    offered_to_partner_ids: list[int] | None = Field(
    default=None,
    sa_column=Column(JSON, nullable=True),
    )

    assigned_at: datetime | None = None
    arrived_at_shop_at: datetime | None = None
    picked_up_at: datetime | None = None
    out_for_delivery_at: datetime | None = None
    arrived_at_customer_at: datetime | None = None
    delivered_at: datetime | None = None

    handover_otp: str | None = None
    handover_otp_attempts: int = Field(default=0)
    handover_otp_expires_at: datetime | None = None
        # Shop pickup verification
    pickup_otp: str | None = None
    pickup_otp_expires_at: datetime | None = None
    pickup_verified_at: datetime | None = None
    pickup_otp_attempts: int = Field(default=0)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )