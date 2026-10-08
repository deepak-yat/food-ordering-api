from enum import Enum

from sqlmodel import Field, SQLModel

class DeliveryPartnerStatus(str, Enum):
    PENDING_VERIFICATION="pending_verification"
    APPROVED = "approved"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class DeliveryPartner(SQLModel, table=True):
    __tablename__= "delivery_partners"

    partner_id : int | None = Field(
        default = None,
        primary_key=True
    )

    user_id : int = Field(
        foreign_key="users.user_id",
        unique= True,
        index=True
    )

    full_name : str

    phone_number : str

    address : str

    vehicle_type :str

    vehicle_number : str

    status : DeliveryPartnerStatus = Field(
        default = DeliveryPartnerStatus.PENDING_VERIFICATION,

    ) 

    is_online : bool = Field(default=False)

    latitude : float | None = None
    longitude : float | None = None

    rejection_reason : str |None = None
