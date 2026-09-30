from datetime import datetime, timezone

from sqlmodel import SQLModel, Field


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    message_id: int | None = Field(
        default=None,
        primary_key=True
    )

    sender_user_id: int = Field(
        foreign_key="users.user_id",
        index=True
    )

    subject: str
    content: str

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )