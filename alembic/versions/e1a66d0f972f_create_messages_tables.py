"""create messages tables

Revision ID: e1a66d0f972f
Revises: f6d785c297d3
Create Date: 2026-09-10 12:24:57.416807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1a66d0f972f"
down_revision: Union[str, Sequence[str], None] = "f6d785c297d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # -----------------------------
    # MESSAGES TABLE
    # -----------------------------

    op.create_table(
        "messages",
        sa.Column(
            "message_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "sender_user_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "subject",
            sa.String(),
            nullable=False
        ),
        sa.Column(
            "content",
            sa.String(),
            nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["sender_user_id"],
            ["users.user_id"]
        ),
        sa.PrimaryKeyConstraint("message_id")
    )

    op.create_index(
        op.f("ix_messages_sender_user_id"),
        "messages",
        ["sender_user_id"],
        unique=False
    )

    # -----------------------------
    # MESSAGE RECIPIENTS TABLE
    # -----------------------------

    op.create_table(
        "message_recipients",
        sa.Column(
            "recipient_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "message_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "shop_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False
        ),
        sa.Column(
            "read_at",
            sa.DateTime(),
            nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["messages.message_id"]
        ),
        sa.ForeignKeyConstraint(
            ["shop_id"],
            ["shops.shop_id"]
        ),
        sa.PrimaryKeyConstraint("recipient_id")
    )

    op.create_index(
        op.f("ix_message_recipients_message_id"),
        "message_recipients",
        ["message_id"],
        unique=False
    )

    op.create_index(
        op.f("ix_message_recipients_shop_id"),
        "message_recipients",
        ["shop_id"],
        unique=False
    )

    # NOTE:
    # No unrelated changes to orders.created_at
    # or shop_monthly_billings.due_at are included here.


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_message_recipients_shop_id"),
        table_name="message_recipients"
    )

    op.drop_index(
        op.f("ix_message_recipients_message_id"),
        table_name="message_recipients"
    )

    op.drop_table("message_recipients")

    op.drop_index(
        op.f("ix_messages_sender_user_id"),
        table_name="messages"
    )

    op.drop_table("messages")