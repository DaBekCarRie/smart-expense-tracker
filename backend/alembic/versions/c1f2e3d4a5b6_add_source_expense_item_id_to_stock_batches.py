"""add source_expense_item_id to stock_batches

Revision ID: c1f2e3d4a5b6
Revises: b8403f601e12
Create Date: 2026-06-06 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1f2e3d4a5b6'
down_revision: Union[str, None] = 'b8403f601e12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'stock_batches',
        sa.Column(
            'source_expense_item_id',
            sa.UUID(),
            sa.ForeignKey('expense_items.id', ondelete='SET NULL'),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_constraint(
        'stock_batches_source_expense_item_id_fkey',
        'stock_batches',
        type_='foreignkey',
    )
    op.drop_column('stock_batches', 'source_expense_item_id')
