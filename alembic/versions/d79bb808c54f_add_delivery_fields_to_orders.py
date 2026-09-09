"""add delivery fields to orders

Revision ID: d79bb808c54f
Revises: 78d71715be97
Create Date: 2026-09-08 11:14:02.236581

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d79bb808c54f"
down_revision: Union[str, Sequence[str], None] = "78d71715be97"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column(
            "delivery_distance",
            sa.Float(),
            nullable=True
        )
    )

    op.add_column(
        "orders",
        sa.Column(
            "delivery_fee",
            sa.Float(),
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_column(
        "orders",
        "delivery_fee"
    )

    op.drop_column(
        "orders",
        "delivery_distance"
    )