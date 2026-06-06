from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    icon: str | None
    model_config = ConfigDict(from_attributes=True)
