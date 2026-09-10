from datetime import datetime, timezone

from sqlmodel import SQLModel, Field


class MessageRecipient(SQLModel, table=True):
    __tablename__ = "message_recipients"

    recipient_id: int | None = Field(
        default=None,
        primary_key=True
    )

    message_id: int = Field(
        foreign_key="messages.message_id",
        index=True
    )

    shop_id: int = Field(
        foreign_key="shops.shop_id",
        index=True
    )

    is_read: bool = False

    read_at: datetime | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )