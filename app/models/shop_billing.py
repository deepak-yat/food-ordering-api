from datetime import datetime, timezone
from enum import Enum

import sqlalchemy as sa
from sqlmodel import SQLModel, Field


class BillingStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class ShopMonthlyBilling(SQLModel, table=True):
    __tablename__ = "shop_monthly_billings"

    __table_args__ = (
        sa.UniqueConstraint(
            "shop_id",
            "billing_year",
            "billing_month",
            name="uq_shop_monthly_billing"
        ),
    )

    billing_id: int | None = Field(
        default=None,
        primary_key=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    billing_year: int
    billing_month: int

    total_revenue: float = 0.0

    fee_rate: float = 0.03

    fee_amount: float = 0.0

    status: BillingStatus = Field(
        default=BillingStatus.PENDING,
        sa_type=sa.Enum(
            BillingStatus,
            name="billingstatus",
            values_callable=lambda enum_cls: [
                member.value for member in enum_cls
            ]
        )
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    due_at : datetime
    paid_at: datetime | None = None