"""add customer address location

Revision ID: 78d71715be97
Revises: 9add4d1607c6
Create Date: 2026-09-07 14:04:35.843817
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "78d71715be97"
down_revision: Union[str, Sequence[str], None] = "9add4d1607c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "customer_addresses",
        sa.Column("latitude", sa.Float(), nullable=True)
    )

    op.add_column(
        "customer_addresses",
        sa.Column("longitude", sa.Float(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column(
        "customer_addresses",
        "longitude"
    )

    op.drop_column(
        "customer_addresses",
        "latitude"
    )