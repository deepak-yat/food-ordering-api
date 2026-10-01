"""add shop reviews

Revision ID: 8e24178b7360
Revises: 07460685a35d
Create Date: 2026-09-30 16:04:29.693887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel
# revision identifiers, used by Alembic.
revision: str = '8e24178b7360'
down_revision: Union[str, Sequence[str], None] = '07460685a35d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "shop_reviews",
        sa.Column("review_id", sa.Integer(), nullable=False),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column(
            "comment",
            sqlmodel.sql.sqltypes.AutoString(length=500),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="ck_shop_review_rating_range",
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.customer_id"],
        ),
        sa.ForeignKeyConstraint(
            ["shop_id"],
            ["shops.shop_id"],
        ),
        sa.PrimaryKeyConstraint("review_id"),
        sa.UniqueConstraint(
            "shop_id",
            "customer_id",
            name="uq_shop_review_customer_shop",
        ),
    )

    op.create_index(
        op.f("ix_shop_reviews_customer_id"),
        "shop_reviews",
        ["customer_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_shop_reviews_shop_id"),
        "shop_reviews",
        ["shop_id"],
        unique=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_index(
        op.f("ix_shop_reviews_shop_id"),
        table_name="shop_reviews",
    )

    op.drop_index(
        op.f("ix_shop_reviews_customer_id"),
        table_name="shop_reviews",
    )

    op.drop_table("shop_reviews")
    # ### end Alembic commands ###
