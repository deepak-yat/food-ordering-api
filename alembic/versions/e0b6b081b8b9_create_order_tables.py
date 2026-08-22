"""create order tables

Revision ID: e0b6b081b8b9
Revises: 149cc6adac89
Create Date: 2026-08-22 09:56:01.716732

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e0b6b081b8b9'
down_revision: Union[str, Sequence[str], None] = '149cc6adac89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create PostgreSQL enum for order status
    order_status = postgresql.ENUM(
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "rejected",
        "cancelled",
        name="orderstatus",
        create_type=False,
    )

    order_status.create(
        op.get_bind(),
        checkfirst=True
    )

    # Create orders table
    op.create_table(
        "orders",

        sa.Column(
            "order_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "customer_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "shop_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "status",
            order_status,
            nullable=False
        ),

        sa.Column(
            "total_amount",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.customer_id"]
        ),

        sa.ForeignKeyConstraint(
            ["shop_id"],
            ["shops.shop_id"]
        ),

        sa.PrimaryKeyConstraint(
            "order_id"
        )
    )

    op.create_index(
        "ix_orders_customer_id",
        "orders",
        ["customer_id"],
        unique=False
    )

    op.create_index(
        "ix_orders_shop_id",
        "orders",
        ["shop_id"],
        unique=False
    )

    # Create order_items table
    op.create_table(
        "order_items",

        sa.Column(
            "order_item_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "order_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "menu_item_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "item_name",
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
            ["order_id"],
            ["orders.order_id"]
        ),

        sa.ForeignKeyConstraint(
            ["menu_item_id"],
            ["menu_items.item_id"]
        ),

        sa.PrimaryKeyConstraint(
            "order_item_id"
        )
    )

    op.create_index(
        "ix_order_items_order_id",
        "order_items",
        ["order_id"],
        unique=False
    )


def downgrade() -> None:

    op.drop_index(
        "ix_order_items_order_id",
        table_name="order_items"
    )

    op.drop_table(
        "order_items"
    )

    op.drop_index(
        "ix_orders_shop_id",
        table_name="orders"
    )

    op.drop_index(
        "ix_orders_customer_id",
        table_name="orders"
    )

    op.drop_table(
        "orders"
    )

    op.execute(
        "DROP TYPE IF EXISTS orderstatus"
    )