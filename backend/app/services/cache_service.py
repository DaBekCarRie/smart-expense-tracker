"""Redis cache helpers for OCR results and general-purpose JSON caching.

Usage pattern (OCR pipeline — Milestone 2):
    1. hash image bytes → cache_key
    2. result = await get_json(redis, cache_key)
    3. if result is None:
           result = await ocr_provider.extract(image_bytes)
           await set_json(redis, cache_key, result.model_dump(), ttl=3600)
    4. return result
"""
from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

DEFAULT_TTL = 3600  # seconds


async def get_json(redis: Redis, key: str) -> Any | None:
    """Return the deserialized JSON value stored at *key*, or None on miss."""
    raw = await redis.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def set_json(
    redis: Redis,
    key: str,
    value: Any,
    ttl: int = DEFAULT_TTL,
) -> None:
    """Serialize *value* to JSON and store with *ttl* seconds expiry."""
    await redis.setex(key, ttl, json.dumps(value, default=str))


async def delete(redis: Redis, key: str) -> None:
    """Delete a cached key."""
    await redis.delete(key)


async def exists(redis: Redis, key: str) -> bool:
    """Return True if *key* exists in Redis."""
    return bool(await redis.exists(key))
