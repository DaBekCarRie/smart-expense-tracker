"""Async SQLAlchemy engine, sessionmaker, Base, and get_db dependency.

This module is the canonical source used by app/core/ consumers.
It re-exports everything from app.database so both import paths work.
"""
from __future__ import annotations

from app.database import AsyncSessionLocal, Base, engine, get_db

__all__ = ["engine", "AsyncSessionLocal", "Base", "get_db"]
