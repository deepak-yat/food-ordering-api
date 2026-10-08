from sqlmodel import Field,SQLModel
from enum import Enum
import sqlalchemy as sa               
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SHOP_OWNER = "SHOP_OWNER"
    CUSTOMER = "CUSTOMER"
    KITCHEN_STAFF = "KITCHEN_STAFF"
    DELIVERY_PARTNER = "delivery_partner"
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

    role: UserRole = Field(
    sa_column=sa.Column(
        sa.Enum(
            UserRole,
            name="userrole",
            values_callable=lambda enum: [item.value for item in enum]
        ),
        nullable=False
    )
)

    is_active : bool

    google_id: str | None = Field(default=None, unique=True, index=True)

    shop_id: int | None = Field(
    default=None,
    foreign_key="shops.shop_id",
    index=True
)