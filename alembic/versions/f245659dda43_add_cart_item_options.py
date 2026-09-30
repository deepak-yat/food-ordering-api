"""add cart item options

Revision ID: f245659dda43
Revises: b57202009ad8
Create Date: 2026-09-17 18:07:18.807897

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f245659dda43"
down_revision: Union[str, Sequence[str], None] = "b57202009ad8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "cart_item_options",

        sa.Column(
            "cart_item_option_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "cart_item_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "option_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["cart_item_id"],
            ["cart_items.cart_item_id"],
        ),

        sa.ForeignKeyConstraint(
            ["option_id"],
            ["menu_item_options.option_id"],
        ),

        sa.PrimaryKeyConstraint(
            "cart_item_option_id",
        ),
    )

    op.create_index(
        op.f("ix_cart_item_options_cart_item_id"),
        "cart_item_options",
        ["cart_item_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_cart_item_options_option_id"),
        "cart_item_options",
        ["option_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_cart_item_options_option_id"),
        table_name="cart_item_options",
    )

    op.drop_index(
        op.f("ix_cart_item_options_cart_item_id"),
        table_name="cart_item_options",
    )

    op.drop_table(
        "cart_item_options",
    )