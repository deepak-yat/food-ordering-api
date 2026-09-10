"""create shop monthly billing

Revision ID: d5ba81220f4c
Revises: 24936e0caaf6
Create Date: 2026-09-10 10:42:57.576734

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'd5ba81220f4c'
down_revision: Union[str, Sequence[str], None] = '24936e0caaf6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        'shop_monthly_billings',
        sa.Column('billing_id', sa.Integer(), nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('billing_year', sa.Integer(), nullable=False),
        sa.Column('billing_month', sa.Integer(), nullable=False),
        sa.Column('total_revenue', sa.Float(), nullable=False),
        sa.Column('fee_rate', sa.Float(), nullable=False),
        sa.Column('fee_amount', sa.Float(), nullable=False),
        sa.Column(
            'status',
            sa.Enum(
                'pending',
                'paid',
                'overdue',
                name='billingstatus'
            ),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['shop_id'],
            ['shops.shop_id']
        ),
        sa.PrimaryKeyConstraint('billing_id'),
        sa.UniqueConstraint(
            'shop_id',
            'billing_year',
            'billing_month',
            name='uq_shop_monthly_billing'
        )
    )

    op.create_index(
        op.f('ix_shop_monthly_billings_shop_id'),
        'shop_monthly_billings',
        ['shop_id'],
        unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f('ix_shop_monthly_billings_shop_id'),
        table_name='shop_monthly_billings'
    )

    op.drop_table('shop_monthly_billings')
    # ### end Alembic commands ###
