from pydantic import BaseModel


class ShopProfileResponse(BaseModel):
    shop_id: int
    shop_name: str
    description: str
    phone: str | None = None

    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    is_active: bool
    is_approved: bool


class ShopProfileUpdate(BaseModel):
    shop_name: str
    description: str
    phone: str | None = None

    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    pincode: str