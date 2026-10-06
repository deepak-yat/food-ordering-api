from sqlmodel import Field, SQLModel
from enum import Enum


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class FoodPreference(str, Enum):
    VEG = "veg"
    NON_VEG = "non_veg"


class KitchenStaff(SQLModel, table=True):
    __tablename__ = "kitchen_staff"

    staff_id: int | None = Field(
        default=None,
        primary_key=True
    )

    user_id: int = Field(
        foreign_key="users.user_id",
        unique=True,
        index=True
    )

    full_name: str

    phone_number: str

    address: str

    age: int

    gender: Gender

    food_preference: FoodPreference

    specialties: str | None = None