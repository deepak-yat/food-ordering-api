"""add order item options

Revision ID: 07460685a35d
Revises: 1fd3b2cd6c4d
Create Date: 2026-09-30 11:31:11.463764

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '07460685a35d'
down_revision: Union[str, Sequence[str], None] = '1fd3b2cd6c4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "order_item_options",
        sa.Column(
            "order_item_option_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "order_item_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "option_id",
            sa.Integer(),
            nullable=True
        ),
        sa.Column(
            "option_name",
            sa.String(),
            nullable=False
        ),
        sa.Column(
            "unit_price",
            sa.Float(),
            nullable=False
        ),
        sa.Column(
            "quantity",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "subtotal",
            sa.Float(),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["order_item_id"],
            ["order_items.order_item_id"]
        ),
        sa.PrimaryKeyConstraint("order_item_option_id")
    )

    op.create_index(
        "ix_order_item_options_option_id",
        "order_item_options",
        ["option_id"],
        unique=False
    )

    op.create_index(
        "ix_order_item_options_order_item_id",
        "order_item_options",
        ["order_item_id"],
        unique=False
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_index(
        "ix_order_item_options_order_item_id",
        table_name="order_item_options"
    )

    op.drop_index(
        "ix_order_item_options_option_id",
        table_name="order_item_options"
    )

    op.drop_table("order_item_options")
    # ### end Alembic commands ###
