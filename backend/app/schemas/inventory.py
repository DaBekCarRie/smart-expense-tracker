from __future__ import annotations

import datetime as _dt
from decimal import Decimal
import uuid

from pydantic import BaseModel, ConfigDict, Field


class StockBatchOut(BaseModel):
    id: uuid.UUID
    quantity: float
    expiry_date: _dt.date | None = None
    created_at: _dt.datetime
    source_expense_item_id: uuid.UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    unit: str
    average_price: Decimal
    last_price: Decimal
    current_stock: float = 0.0
    min_stock: float | None = None
    created_at: _dt.datetime
    updated_at: _dt.datetime
    batches: list[StockBatchOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProductStockAdjust(BaseModel):
    quantity_change: float


class ProductMinStockUpdate(BaseModel):
    min_stock: float | None = None
