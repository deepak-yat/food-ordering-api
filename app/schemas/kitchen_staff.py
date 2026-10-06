from pydantic import BaseModel, Field
from app.models.kitchen_staff import Gender, FoodPreference


class KitchenStaffCreate(BaseModel):
    user_name: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)

    full_name: str = Field(min_length=2, max_length=100)
    phone_number: str = Field(min_length=7, max_length=20)
    address: str = Field(min_length=3, max_length=300)

    age: int = Field(ge=18, le=100)

    gender: Gender
    food_preference: FoodPreference

    specialties: str | None = Field(
        default=None,
        max_length=500
    )


class KitchenStaffResponse(BaseModel):
    staff_id: int
    user_id: int
    user_name: str
    full_name: str
    phone_number: str
    address: str
    age: int
    gender: Gender
    food_preference: FoodPreference
    specialties: str | None
    is_active: bool

class KitchenStaffUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    phone_number: str | None = Field(
        default=None,
        min_length=7,
        max_length=20
    )

    address: str | None = Field(
        default=None,
        min_length=3,
        max_length=300
    )

    age: int | None = Field(
        default=None,
        ge=18,
        le=100
    )

    gender: Gender | None = None

    food_preference: FoodPreference | None = None

    specialties: str | None = Field(
        default=None,
        max_length=500
    )

class KitchenStaffPasswordUpdate(BaseModel):
    new_password: str = Field(
        min_length=6,
        max_length=128
    )