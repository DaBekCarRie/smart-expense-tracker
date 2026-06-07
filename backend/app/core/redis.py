"""Redis connection pool and get_redis dependency."""
from __future__ import annotations

from redis.asyncio import Redis, ConnectionPool

from app.core.config import settings

# Module-level pool created once at import; used by dependency
_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
            health_check_interval=30,
            socket_keepalive=True,
        )
    return _pool


async def get_redis() -> Redis:
    """FastAPI dependency — returns a Redis client from the connection pool."""
    return Redis(connection_pool=get_pool())
