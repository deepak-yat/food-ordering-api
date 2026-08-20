"""adding admin

Revision ID: 2ac52096bff0
Revises: 5c11964dd7f4
Create Date: 2026-08-20 16:02:25.459092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '2ac52096bff0'
down_revision: Union[str, Sequence[str], None] = '5c11964dd7f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO users
            (user_name, user_email, password_hash, role, is_active)
        VALUES
            (
                'admin',
                'admin@foodplatform.com',
                '$argon2id$v=19$m=65536,t=3,p=4$ZQu4LHp/N02om/XHas601A$iFhVqSHzmEtQedfAWLG2/SAkD9k/sHrsu1CSGz9g61k',
                'ADMIN',
                TRUE
            )
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    pass
