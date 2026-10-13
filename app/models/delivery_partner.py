from enum import Enum
from datetime import datetime
from sqlmodel import Field, SQLModel


class DeliveryPartnerStatus(str, Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"


class DeliveryPartner(SQLModel, table=True):
    __tablename__ = "delivery_partners"

    partner_id: int | None = Field(
        default=None,
        primary_key=True,
    )

    user_id: int = Field(
        foreign_key="users.user_id",
        unique=True,
        index=True,
    )

    full_name: str
    phone_number: str
    address: str
    vehicle_type: str
    vehicle_number: str

    status: DeliveryPartnerStatus = Field(
        default=DeliveryPartnerStatus.PENDING_VERIFICATION,
    )

    is_online: bool = Field(default=False)

    latitude: float | None = None
    longitude: float | None =  None
    location_updated_at: datetime | None = None
    rejection_reason: str | None = None