"""Add performance indexes on StockBatch, ShoppingListItem, ExpenseItem

Revision ID: f5b6c7d8e9a0
Revises: e3f4a5b6c7d8
Create Date: 2026-06-07

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "f5b6c7d8e9a0"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # StockBatch — queried heavily in inventory and expense delete/update
    op.create_index("idx_stock_batches_product_id", "stock_batches", ["product_id"])
    op.create_index("idx_stock_batches_source_expense_item_id", "stock_batches", ["source_expense_item_id"])
    op.create_index("idx_stock_batches_expiry_date", "stock_batches", ["expiry_date"])

    # ShoppingListItem — filtered by user and purchased status
    op.create_index("idx_shopping_list_user_id", "shopping_list_items", ["user_id"])
    op.create_index("idx_shopping_list_user_purchased", "shopping_list_items", ["user_id", "is_purchased"])

    # ExpenseItem — joined from expenses, filtered by category
    op.create_index("idx_expense_items_expense_id", "expense_items", ["expense_id"])
    op.create_index("idx_expense_items_category_id", "expense_items", ["category_id"])


def downgrade() -> None:
    op.drop_index("idx_expense_items_category_id", table_name="expense_items")
    op.drop_index("idx_expense_items_expense_id", table_name="expense_items")
    op.drop_index("idx_shopping_list_user_purchased", table_name="shopping_list_items")
    op.drop_index("idx_shopping_list_user_id", table_name="shopping_list_items")
    op.drop_index("idx_stock_batches_expiry_date", table_name="stock_batches")
    op.drop_index("idx_stock_batches_source_expense_item_id", table_name="stock_batches")
    op.drop_index("idx_stock_batches_product_id", table_name="stock_batches")
