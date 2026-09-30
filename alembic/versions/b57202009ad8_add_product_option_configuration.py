"""add product option configuration

Revision ID: b57202009ad8
Revises: 82bcec5621c5
Create Date: 2026-09-16 12:16:30.760144
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "b57202009ad8"
down_revision: Union[str, Sequence[str], None] = "82bcec5621c5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    bind = op.get_bind()
    inspector = inspect(bind)

    existing_tables = set(inspector.get_table_names())

    # ---------------------------------------------------------
    # menu_item_option_groups
    # ---------------------------------------------------------

    if "menu_item_option_groups" not in existing_tables:

        op.create_table(
            "menu_item_option_groups",

            sa.Column(
                "group_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "menu_item_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "name",
                sa.String(),
                nullable=False,
            ),

            sa.Column(
                "selection_type",
                sa.String(),
                nullable=False,
            ),

            sa.Column(
                "required",
                sa.Boolean(),
                nullable=False,
            ),

            sa.Column(
                "min_selection",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "max_selection",
                sa.Integer(),
                nullable=True,
            ),

            sa.Column(
                "display_order",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
            ),

            sa.ForeignKeyConstraint(
                ["menu_item_id"],
                ["menu_items.item_id"],
            ),

            sa.PrimaryKeyConstraint(
                "group_id"
            ),
        )

    # Create index only if it doesn't already exist
    existing_indexes = {
        index["name"]
        for index in inspector.get_indexes(
            "menu_item_option_groups"
        )
    } if "menu_item_option_groups" in existing_tables else set()

    if "ix_menu_item_option_groups_menu_item_id" not in existing_indexes:

        op.create_index(
            "ix_menu_item_option_groups_menu_item_id",
            "menu_item_option_groups",
            ["menu_item_id"],
            unique=False,
        )

    # ---------------------------------------------------------
    # menu_item_options
    # ---------------------------------------------------------

    # Refresh table list
    inspector = inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "menu_item_options" not in existing_tables:

        op.create_table(
            "menu_item_options",

            sa.Column(
                "option_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "group_id",
                sa.Integer(),
                nullable=False,
            ),

            sa.Column(
                "name",
                sa.String(),
                nullable=False,
            ),

            sa.Column(
                "price",
                sa.Float(),
                nullable=False,
            ),

            sa.Column(
                "is_available",
                sa.Boolean(),
                nullable=False,
            ),

            sa.Column(
                "display_order",
                sa.Integer(),
                nullable=False,
            ),

            sa.ForeignKeyConstraint(
                ["group_id"],
                ["menu_item_option_groups.group_id"],
            ),

            sa.PrimaryKeyConstraint(
                "option_id"
            ),
        )

    # Create index only if it doesn't already exist
    inspector = inspect(bind)

    existing_indexes = {
        index["name"]
        for index in inspector.get_indexes(
            "menu_item_options"
        )
    } if "menu_item_options" in existing_tables else set()

    if "ix_menu_item_options_group_id" not in existing_indexes:

        op.create_index(
            "ix_menu_item_options_group_id",
            "menu_item_options",
            ["group_id"],
            unique=False,
        )

    # ---------------------------------------------------------
    # menu_items columns
    # ---------------------------------------------------------

    inspector = inspect(bind)

    menu_item_columns = {
        column["name"]
        for column in inspector.get_columns("menu_items")
    }

    # has_options

    if "has_options" not in menu_item_columns:

        op.add_column(
            "menu_items",
            sa.Column(
                "has_options",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )

    # allow_parent_purchase

    if "allow_parent_purchase" not in menu_item_columns:

        op.add_column(
            "menu_items",
            sa.Column(
                "allow_parent_purchase",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            ),
        )


def downgrade() -> None:
    """Downgrade schema."""

    bind = op.get_bind()
    inspector = inspect(bind)

    # Remove columns only if they exist
    menu_item_columns = {
        column["name"]
        for column in inspector.get_columns("menu_items")
    }

    if "allow_parent_purchase" in menu_item_columns:

        op.drop_column(
            "menu_items",
            "allow_parent_purchase",
        )

    if "has_options" in menu_item_columns:

        op.drop_column(
            "menu_items",
            "has_options",
        )

    # Remove menu_item_options

    inspector = inspect(bind)

    if "menu_item_options" in inspector.get_table_names():

        indexes = {
            index["name"]
            for index in inspector.get_indexes(
                "menu_item_options"
            )
        }

        if "ix_menu_item_options_group_id" in indexes:

            op.drop_index(
                "ix_menu_item_options_group_id",
                table_name="menu_item_options",
            )

        op.drop_table(
            "menu_item_options"
        )

    # Remove menu_item_option_groups

    inspector = inspect(bind)

    if "menu_item_option_groups" in inspector.get_table_names():

        indexes = {
            index["name"]
            for index in inspector.get_indexes(
                "menu_item_option_groups"
            )
        }

        if "ix_menu_item_option_groups_menu_item_id" in indexes:

            op.drop_index(
                "ix_menu_item_option_groups_menu_item_id",
                table_name="menu_item_option_groups",
            )

        op.drop_table(
            "menu_item_option_groups"
        )