from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    role: str
    is_active: bool


class AdminUsersResponse(BaseModel):
    customers: list[AdminUserResponse]
    shop_owners: list[AdminUserResponse]