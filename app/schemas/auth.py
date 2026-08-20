from pydantic import BaseModel, EmailStr


class CustomerRegister(BaseModel):
    user_name: str
    user_email: str
    password: str


class LoginRequest(BaseModel):
    user_name: str
    password: str

class ShopRegister(BaseModel):
    user_name: str
    user_email: str
    password: str
    shop_name: str
    description: str | None = None
    