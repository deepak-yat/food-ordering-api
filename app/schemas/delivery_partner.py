from pydantic import BaseModel, Field

from app.models.delivery_partner import DeliveryPartnerStatus

class DeliveryPartnerAdminResponse(BaseModel):
    partner_id : int
    user_id : int
    user_name : str
    user_email : str

    full_name : str
    phone_number : str
    address : str
    vehicle_type : str
    vehicle_number : str

    status : DeliveryPartnerStatus


class DeliveryPartnerRejectRequest(BaseModel):
    rejection_reason: str = Field(
        min_length=3,
        max_length=500
    )





class DeliveryPartnerLocationUpdate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90
    )
    longitude: float = Field(
        ge=-180,
        le=180
    )