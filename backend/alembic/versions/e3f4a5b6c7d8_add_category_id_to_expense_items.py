"""Add category_id to expense_items; migrate from expenses.category_id

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-06-07

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add category_id column to expense_items
    op.add_column(
        "expense_items",
        sa.Column("category_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_expense_items_category_id",
        "expense_items",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 2. Migrate existing category_id from expenses → all child expense_items
    op.execute(
        """
        UPDATE expense_items ei
        SET category_id = e.category_id
        FROM expenses e
        WHERE ei.expense_id = e.id
          AND e.category_id IS NOT NULL
        """
    )

    # 3. Drop the now-redundant index on expenses(user_id, category_id)
    op.drop_index("idx_expenses_user_category", table_name="expenses")


def downgrade() -> None:
    # Restore index
    op.create_index(
        "idx_expenses_user_category",
        "expenses",
        ["user_id", "category_id"],
        unique=False,
    )

    # Drop FK and column from expense_items
    op.drop_constraint("fk_expense_items_category_id", "expense_items", type_="foreignkey")
    op.drop_column("expense_items", "category_id")
