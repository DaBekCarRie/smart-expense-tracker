"""expand category icon column to varchar(255)

Revision ID: d2e3f4a5b6c7
Revises: c1f2e3d4a5b6
Create Date: 2026-06-06 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, None] = 'c1f2e3d4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'categories',
        'icon',
        existing_type=sa.String(50),
        type_=sa.String(255),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'categories',
        'icon',
        existing_type=sa.String(255),
        type_=sa.String(50),
        existing_nullable=True,
    )
