from pydantic import BaseModel

class CustomerAddressCreate(BaseModel):
    address_line1 : str
    address_line2 : str | None = None
    city : str
    state : str
    pincode : str
    is_default : bool
    latitude : float | None = None
    longitude : float | None = None


class CustomerAddressUpdate(BaseModel):
    address_line1 : str | None = None
    address_line2 : str | None = None
    city : str | None = None
    state : str | None = None
    pincode : str | None = None
    is_default : bool | None = None
    latitude : float | None= None
    longitude : float | None=None

class CustomerAddressResponse(BaseModel):
    address_id : int
    customer_id : int
    address_line1 : str
    address_line2 : str | None = None
    city : str
    state : str
    pincode : str
    is_default : bool
    latitude : float
    longitude : float

class CustomerProfileUpdate(BaseModel):
    customer_name: str | None = None
    phone: str | None = None

class CustomerProfileResponse(BaseModel):
    customer_id: int
    user_id: int
    customer_name: str
    phone: str | None

class CurrentLocationRequest(BaseModel):
    latitude: float
    longitude: float