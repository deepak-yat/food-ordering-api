from sqlmodel import Field,SQLModel
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    SHOP_OWNER = "shop_owner"
    CUSTOMER = "customer"


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

    password_hash : str

    role : UserRole

    is_active : bool