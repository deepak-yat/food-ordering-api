from pydantic import BaseModel, ConfigDict, Field


class DeliveryPartnerProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    phone_number: str | None = Field(default=None, min_length=7, max_length=20)
    address: str | None = Field(default=None, min_length=3, max_length=255)
    vehicle_type: str | None = Field(default=None, min_length=2, max_length=50)
    vehicle_number: str | None = Field(default=None, min_length=2, max_length=30)

class DeliveryPartnerAvailabilityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_online: bool

from pydantic import BaseModel, ConfigDict, Field


class DeliveryPartnerLocationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)