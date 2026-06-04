from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ExpenseCreate(BaseModel):
    merchant: str = Field(min_length=1, max_length=255)
    amount: Decimal = Field(gt=0, decimal_places=2)
    currency: str = Field(default="USD", max_length=3)
    expense_date: date
    category_id: int | None = None
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    merchant: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, max_length=3)
    expense_date: date | None = None
    category_id: int | None = None
    notes: str | None = None


class ExpenseOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    merchant: str
    amount: Decimal
    currency: str
    expense_date: date
    category_id: int | None
    notes: str | None
    receipt_url: str | None
    ocr_raw: dict | None
    ocr_confidence: float | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CursorPage(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None
    has_more: bool
    total: int
