"""Transaction Pydantic v2 schemas.

These wrap the Expense ORM model using "transaction" terminology as required
by the M1 spec.  The field mapping is:
    transaction_date  ←→  Expense.expense_date
    description       ←→  Expense.notes
"""
from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class TransactionBase(BaseModel):
    merchant: str = Field(min_length=1, max_length=255, description="Merchant / payee name")
    amount: Decimal = Field(gt=0, decimal_places=2, description="Transaction amount")
    currency: str = Field(default="USD", max_length=3)
    expense_date: date = Field(description="Date the transaction occurred")
    category_id: int | None = Field(default=None, description="Foreign key to categories table")
    notes: str | None = Field(default=None, description="Optional notes / description")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TransactionCreate(TransactionBase):
    pass


# ---------------------------------------------------------------------------
# Update  (all fields optional for partial updates)
# ---------------------------------------------------------------------------

class TransactionUpdate(BaseModel):
    merchant: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, max_length=3)
    expense_date: date | None = None
    category_id: int | None = None
    notes: str | None = None
    receipt_url: str | None = None


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    merchant: str
    amount: Decimal
    currency: str
    expense_date: date
    category_id: int | None
    notes: str | None = None
    receipt_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
