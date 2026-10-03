"""add is veg to menu items

Revision ID: 116ba73ffed4
Revises: 8e24178b7360
Create Date: 2026-10-03 09:39:41.299101

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "116ba73ffed4"
down_revision: Union[str, Sequence[str], None] = "8e24178b7360"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "menu_items",
        sa.Column(
            "is_veg",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        )
    )


def downgrade() -> None:
    op.drop_column("menu_items", "is_veg")