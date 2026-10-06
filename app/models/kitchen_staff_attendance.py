from datetime import date, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ON_LEAVE = "on_leave"


class KitchenStaffAttendance(SQLModel, table=True):
    __tablename__ = "kitchen_staff_attendance"

    attendance_id: int | None = Field(
        default=None,
        primary_key=True
    )

    staff_id: int = Field(
        foreign_key="kitchen_staff.staff_id",
        index=True
    )

    attendance_date: date = Field(
        index=True
    )

    login_at: datetime | None = None

    logout_at: datetime | None = None

    status: AttendanceStatus = Field(
        default=AttendanceStatus.PRESENT
    )