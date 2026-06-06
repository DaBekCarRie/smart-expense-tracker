from __future__ import annotations

import datetime as _dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class ShoppingListItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    quantity: float = Field(default=1.0, gt=0)
    unit: str = Field(default="หน่วย", max_length=50)


class ShoppingListItemOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    quantity: float
    unit: str
    is_purchased: bool
    created_at: _dt.datetime

    model_config = ConfigDict(from_attributes=True)
