"""add image url to shops

Revision ID: 7f0a428d8631
Revises: c644726abfb4
Create Date: 2026-09-23 13:51:14.329153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f0a428d8631'
down_revision: Union[str, Sequence[str], None] = 'c644726abfb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
    "shops",
    sa.Column("image_url", sa.String(), nullable=True)
)
    pass


def downgrade() -> None:
    op.drop_column("shops", "image_url")    
    pass
