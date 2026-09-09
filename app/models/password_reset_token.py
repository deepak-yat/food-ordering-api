from datetime import datetime

from sqlmodel import Field, SQLModel


class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: int | None = Field(
        default=None,
        primary_key=True
    )

    user_id: int = Field(
        foreign_key="users.user_id",
        index=True
    )

    token_hash: str = Field(
        unique=True,
        index=True
    )

    expires_at: datetime

    used_at: datetime | None = Field(
        default=None
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow
    )