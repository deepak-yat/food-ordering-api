"""Add offer template configuration

Revision ID: eb4f41a60800
Revises: 033804e1a1b6
Create Date: 2026-10-16 17:46:52.387139
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision: str = "eb4f41a60800"
down_revision: Union[str, Sequence[str], None] = "033804e1a1b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add visual template configuration to existing offers."""

    op.add_column(
        "offers",
        sa.Column(
            "template_id",
            sa.String(length=50),
            nullable=False,
            server_default=sa.text("'premium_feast'"),
        ),
    )

    op.add_column(
        "offers",
        sa.Column(
            "design_config",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )

    op.create_index(
        op.f("ix_offers_template_id"),
        "offers",
        ["template_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove offer template configuration."""

    op.drop_index(
        op.f("ix_offers_template_id"),
        table_name="offers",
    )

    op.drop_column("offers", "design_config")
    op.drop_column("offers", "template_id")