from __future__ import annotations

import uuid

from fastapi import Cookie, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.auth_service import decode_token


async def get_redis() -> Redis:
    from app.core.redis import get_redis as _pool_get_redis
    return await _pool_get_redis()


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User
    from sqlalchemy import select
    import uuid

    # MOCK USER FOR DEVELOPMENT (Disables login requirement)
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            id=uuid.uuid4(),
            email="mock@example.com",
            password_hash="mock",
            name="Mock User"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user
