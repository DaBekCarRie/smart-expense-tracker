"""Shared pytest fixtures for Smart Expense Tracker backend tests.

Uses:
- aiosqlite + SQLAlchemy async engine (in-memory SQLite) for DB isolation
- fakeredis for Redis isolation (no real Redis needed)
- httpx AsyncClient with ASGI transport for full-stack endpoint tests
"""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import fakeredis.aioredis as fakeredis
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app, create_app

# ---------------------------------------------------------------------------
# Async SQLite engine (in-memory, per test session)
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once per test session."""
    # Import all models so metadata is populated
    import app.models  # noqa: F401

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession that rolls back after each test."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


# ---------------------------------------------------------------------------
# Fake Redis
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def fake_redis():
    """Return a fakeredis async client."""
    redis = fakeredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


# ---------------------------------------------------------------------------
# FastAPI test client with DB + Redis overrides
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture()
async def client(db_session: AsyncSession, fake_redis) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient wired to the test DB and fake Redis."""

    async def _override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    async def _override_get_redis():
        return fake_redis

    # Patch both the app.database get_db and the dependencies get_redis
    from app import dependencies
    from app import database

    app.dependency_overrides[database.get_db] = _override_get_db
    app.dependency_overrides[dependencies.get_redis] = _override_get_redis

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user_payload(suffix: str | None = None) -> dict:
    tag = suffix or uuid.uuid4().hex[:8]
    return {
        "email": f"user_{tag}@example.com",
        "name": f"Test User {tag}",
        "password": "SecurePass123",
    }
