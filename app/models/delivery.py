from datetime import datetime, timezone

from enum import Enum

import sqlalchemy as sa

from sqlmodel import Field, SQLModel


class DeliveryStatus(str, Enum):
    PENDING_OFFER = "pending_offer"
    OFFERED = "offered"
    ASSIGNED = "assigned"
    ARRIVED_AT_SHOP = "arrived_at_shop"
    PICKED_UP = "picked_up"
    OUT_FOR_DELIVERY = "out_for_delivery"
    ARRIVED_AT_CUSTOMER = "arrived_at_customer"
    DELIVERED = "delivered"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Delivery(SQLModel, table=True):
    __tablename__ = "deliveries"

    delivery_id : int | None = Field(
            default = None,
            primary_key=True
    )

    order_id : int = Field(
        foreign_key = "orders.order_id",
        unique=True,
        index = True
    )

    delivery_partner_id : int | None = Field(
        default=None,
        foreign_key= "delivery_partners.partner_id",
        index= True
    )

    status : DeliveryStatus = Field(
        default=DeliveryStatus.PENDING_OFFER,
        sa_column=sa.Column(
            sa.Enum(
                DeliveryStatus,
                name="deliverystatus"
            ),
            nullable=False
        )
    )
    distance_km : float | None = None

    customer_fee : float | None = None
    partner_earning : float | None = None

    platform_fee : float | None = None

    offer_expires_at : datetime | None = Field(
        default = None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )

    offered_to_partner_ids : list[int] = Field(
        default_factory= list,
        sa_column= sa.Column(sa.JSON)
    )

    assigned_at: datetime | None = Field(
        default = None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )
    arrived_at_shop_at : datetime | None = Field(
        default = None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )

    picked_up_at : datetime | None =Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )

    out_for_delivery_at : datetime | None = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )
    arrived_at_customer_at: datetime | None = Field(
    default=None,
    sa_column=sa.Column(sa.DateTime(timezone=True))
    )
    delivered_at : datetime | None = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )

    handover_otp : str | None = None
    handover_otp_attempts: int = Field(default=0)
    handover_otp_expires_at : datetime | None = Field(
        default=None,
        sa_column=sa.Column(sa.DateTime(timezone=True))
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=sa.Column(
            sa.DateTime(timezone=True),
            nullable=False
        )
    )