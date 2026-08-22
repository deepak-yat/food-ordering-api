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


class ShopRegisterResponse(BaseModel):
    message: str
    user_id: int
    shop_id: int


class LoginRequest(BaseModel):
    user_name: str
    password: str