from datetime import datetime

from sqlmodel import Field, SQLModel


class EmailVerification(SQLModel, table=True):
    __tablename__ = "email_verifications"

    verification_id: int | None = Field(
        default=None,
        primary_key=True
    )

    email: str = Field(
        index=True
    )
    user_name: str
    password_hash: str
    code: str

    expires_at: datetime

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )