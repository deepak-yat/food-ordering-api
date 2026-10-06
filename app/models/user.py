from sqlmodel import Field,SQLModel
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    SHOP_OWNER = "shop_owner"
    CUSTOMER = "customer"
    KITCHEN_STAFF = "kitchen_staff"

class User(SQLModel,table=True):
    __tablename__="users"

    user_id:int | None =Field(
        default=None,
        primary_key=True
    )

    user_name : str = Field(
        index=True,
        unique=True
    )

    user_email : str = Field(
        unique=True,
        index=True
    )

    password_hash : str | None = None

    role : UserRole

    is_active : bool

    google_id: str | None = Field(default=None, unique=True, index=True)

    shop_id: int | None = Field(
    default=None,
    foreign_key="shops.shop_id",
    index=True
)