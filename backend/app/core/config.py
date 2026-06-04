"""Application settings — reads from .env via pydantic-settings.

This module is the canonical import path for settings within app/core/.
It re-exports the singleton from app.config so both paths work:
    from app.config import settings
    from app.core.config import settings
"""
from __future__ import annotations

from app.config import Settings, settings  # noqa: F401

__all__ = ["Settings", "settings"]
