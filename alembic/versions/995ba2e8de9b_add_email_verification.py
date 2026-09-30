"""add email verification

Revision ID: 995ba2e8de9b
Revises: eac11adc5bfa
Create Date: 2026-09-24 12:14:50.331737
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "995ba2e8de9b"
down_revision: Union[str, Sequence[str], None] = "eac11adc5bfa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_verifications",
        sa.Column(
            "verification_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "code",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("verification_id"),
    )

    op.create_index(
        "ix_email_verifications_email",
        "email_verifications",
        ["email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_email_verifications_email",
        table_name="email_verifications",
    )

    op.drop_table("email_verifications")