"""add notification indexes

Revision ID: 1fd3b2cd6c4d
Revises: 97feb709bba1
Create Date: 2026-09-29 10:36:07.346628

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1fd3b2cd6c4d'
down_revision: Union[str, Sequence[str], None] = '97feb709bba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_notifications_customer_created_at",
        "notifications",
        ["customer_id", "created_at"],
        unique=False,
    )

    op.create_index(
        "ix_notifications_customer_is_read",
        "notifications",
        ["customer_id", "is_read"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notifications_customer_is_read",
        table_name="notifications",
    )

    op.drop_index(
        "ix_notifications_customer_created_at",
        table_name="notifications",
    )