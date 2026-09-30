"""add shop location fields

Revision ID: 9add4d1607c6
Revises: 885aa7cb5d1d
Create Date: 2026-09-07 10:53:48.348792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9add4d1607c6'
down_revision: Union[str, Sequence[str], None] = '885aa7cb5d1d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'shops',
        sa.Column('address_line1', sa.String(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('address_line2', sa.String(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('city', sa.String(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('state', sa.String(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('pincode', sa.String(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('latitude', sa.Float(), nullable=True)
    )
    op.add_column(
        'shops',
        sa.Column('longitude', sa.Float(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('shops', 'longitude')
    op.drop_column('shops', 'latitude')
    op.drop_column('shops', 'pincode')
    op.drop_column('shops', 'state')
    op.drop_column('shops', 'city')
    op.drop_column('shops', 'address_line2')
    op.drop_column('shops', 'address_line1')
    # ### end Alembic commands ###
