"""add icon to categories

Revision ID: 83dd819490f6
Revises: 72cc709389e5
Create Date: 2026-06-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83dd819490f6'
down_revision: Union[str, None] = '72cc709389e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('categories', sa.Column('icon', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('categories', 'icon')
