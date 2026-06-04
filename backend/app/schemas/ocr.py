from __future__ import annotations

import datetime as _dt
from decimal import Decimal

from pydantic import BaseModel, Field


class OCRResult(BaseModel):
    merchant: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    # Named `receipt_date` internally; serialised as `date` for API compatibility
    receipt_date: _dt.date | None = Field(default=None, serialization_alias="date")
    raw_text: str = ""
    confidence: float = 0.0
    cached: bool = False
    processing_time_ms: float = 0.0

    model_config = {"populate_by_name": True, "populate_by_alias": False}


class OCRUploadResponse(BaseModel):
    merchant: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    expense_date: _dt.date | None = Field(default=None)
    raw_text: str = ""
    confidence: float = 0.0
    cached: bool = False
    processing_time_ms: float = 0.0

    @classmethod
    def from_result(cls, result: OCRResult) -> "OCRUploadResponse":
        return cls(
            merchant=result.merchant,
            amount=result.amount,
            currency=result.currency,
            expense_date=result.receipt_date,
            raw_text=result.raw_text,
            confidence=result.confidence,
            cached=result.cached,
            processing_time_ms=result.processing_time_ms,
        )
