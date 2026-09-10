from pydantic import BaseModel
from app.models.shop_billing import BillingStatus
from sqlmodel import SQLModel
class AdminUserResponse(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    role: str
    is_active: bool


class AdminUsersResponse(BaseModel):
    customers: list[AdminUserResponse]
    shop_owners: list[AdminUserResponse]

class BillingStatusUpdate(BaseModel):
    status : BillingStatus

class AdminBroadcastMessage(SQLModel):
    subject: str
    content: str