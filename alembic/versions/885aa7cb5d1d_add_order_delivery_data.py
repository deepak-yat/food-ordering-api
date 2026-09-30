"""add order delivery data

Revision ID: 885aa7cb5d1d
Revises: e0b6b081b8b9
Create Date: 2026-09-03 09:20:04.974117

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "885aa7cb5d1d"
down_revision: Union[str, Sequence[str], None] = "e0b6b081b8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "customer_addresses",

        sa.Column(
            "address_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "customer_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "address_line1",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "address_line2",
            sa.String(),
            nullable=True
        ),

        sa.Column(
            "city",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "state",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "pincode",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "is_default",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        ),

        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.customer_id"]
        ),

        sa.PrimaryKeyConstraint("address_id")
    )

    op.create_index(
        op.f("ix_customer_addresses_customer_id"),
        "customer_addresses",
        ["customer_id"],
        unique=False
    )

    op.create_table(
        "order_delivery_addresses",

        sa.Column(
            "delivery_address_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "order_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "address_line1",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "address_line2",
            sa.String(),
            nullable=True
        ),

        sa.Column(
            "city",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "state",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "pincode",
            sa.String(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.order_id"]
        ),

        sa.PrimaryKeyConstraint(
            "delivery_address_id"
        )
    )

    op.create_index(
        op.f("ix_order_delivery_addresses_order_id"),
        "order_delivery_addresses",
        ["order_id"],
        unique=True
    )

    op.add_column(
        "orders",
        sa.Column(
            "delivery_instruction",
            sa.String(),
            nullable=True
        )
    )

    op.add_column(
        "shops",
        sa.Column(
            "phone",
            sa.String(),
            nullable=True
        )
    )


def downgrade() -> None:

    op.drop_column(
        "shops",
        "phone"
    )

    op.drop_column(
        "orders",
        "delivery_instruction"
    )

    op.drop_index(
        op.f("ix_order_delivery_addresses_order_id"),
        table_name="order_delivery_addresses"
    )

    op.drop_table(
        "order_delivery_addresses"
    )

    op.drop_index(
        op.f("ix_customer_addresses_customer_id"),
        table_name="customer_addresses"
    )

    op.drop_table(
        "customer_addresses"
    )