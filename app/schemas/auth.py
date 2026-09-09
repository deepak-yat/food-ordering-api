from pydantic import BaseModel, EmailStr


class CustomerRegister(BaseModel):
    user_name: str
    user_email: EmailStr
    password: str


class CustomerRegisterResponse(BaseModel):
    message: str
    user_id: int
    customer_id: int


class ShopRegister(BaseModel):
    user_name: str
    user_email: EmailStr
    password: str
    shop_name: str
    description: str | None = None
    address_line1 : str
    address_line2 : str | None = None
    city : str
    state : str
    pincode : str    


class ShopRegisterResponse(BaseModel):
    message: str
    user_id: int
    shop_id: int


class LoginRequest(BaseModel):
    user_name: str
    password: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    user_email: str