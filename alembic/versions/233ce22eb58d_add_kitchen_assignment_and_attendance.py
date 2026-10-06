"""add kitchen assignment and attendance

Revision ID: 233ce22eb58d
Revises: f1bae3af61ac
Create Date: 2026-10-05 11:25:39.882338

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '233ce22eb58d'
down_revision: Union[str, Sequence[str], None] = 'f1bae3af61ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        'kitchen_staff_attendance',
        sa.Column('attendance_id', sa.Integer(), nullable=False),
        sa.Column('staff_id', sa.Integer(), nullable=False),
        sa.Column('attendance_date', sa.Date(), nullable=False),
        sa.Column('login_at', sa.DateTime(), nullable=True),
        sa.Column('logout_at', sa.DateTime(), nullable=True),
        sa.Column(
            'status',
            sa.Enum(
                'PRESENT',
                'ON_LEAVE',
                name='attendancestatus'
            ),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ['staff_id'],
            ['kitchen_staff.staff_id']
        ),
        sa.PrimaryKeyConstraint('attendance_id')
    )

    op.create_index(
        op.f('ix_kitchen_staff_attendance_attendance_date'),
        'kitchen_staff_attendance',
        ['attendance_date'],
        unique=False
    )

    op.create_index(
        op.f('ix_kitchen_staff_attendance_staff_id'),
        'kitchen_staff_attendance',
        ['staff_id'],
        unique=False
    )

    op.add_column(
        'orders',
        sa.Column(
            'assigned_kitchen_staff_id',
            sa.Integer(),
            nullable=True
        )
    )

    op.create_index(
        op.f('ix_orders_assigned_kitchen_staff_id'),
        'orders',
        ['assigned_kitchen_staff_id'],
        unique=False
    )

    op.create_foreign_key(
        None,
        'orders',
        'kitchen_staff',
        ['assigned_kitchen_staff_id'],
        ['staff_id']
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        None,
        'orders',
        type_='foreignkey'
    )

    op.drop_index(
        op.f('ix_orders_assigned_kitchen_staff_id'),
        table_name='orders'
    )

    op.drop_column(
        'orders',
        'assigned_kitchen_staff_id'
    )

    op.drop_index(
        op.f('ix_kitchen_staff_attendance_staff_id'),
        table_name='kitchen_staff_attendance'
    )

    op.drop_index(
        op.f('ix_kitchen_staff_attendance_attendance_date'),
        table_name='kitchen_staff_attendance'
    )

    op.drop_table('kitchen_staff_attendance')   
    # ### end Alembic commands ###
