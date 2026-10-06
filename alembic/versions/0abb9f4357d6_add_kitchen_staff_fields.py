"""add kitchen staff fields

Revision ID: 0abb9f4357d6
Revises: 116ba73ffed4
Create Date: 2026-10-05 09:34:44.956013

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0abb9f4357d6'
down_revision: Union[str, Sequence[str], None] = '116ba73ffed4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'orders',
        sa.Column(
            'preparation_started_at',
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.add_column(
        'orders',
        sa.Column(
            'kitchen_ready_at',
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.add_column(
        'users',
        sa.Column(
            'shop_id',
            sa.Integer(),
            nullable=True
        )
    )

    op.create_index(
        op.f('ix_users_shop_id'),
        'users',
        ['shop_id'],
        unique=False
    )

    op.create_foreign_key(
        None,
        'users',
        'shops',
        ['shop_id'],
        ['shop_id']
    )
def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'users', type_='foreignkey')

    op.drop_index(
        op.f('ix_users_shop_id'),
        table_name='users'
    )

    op.drop_column('users', 'shop_id')

    op.drop_column('orders', 'kitchen_ready_at')
    op.drop_column('orders', 'preparation_started_at')
    # ### end Alembic commands ###
