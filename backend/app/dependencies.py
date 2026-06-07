from __future__ import annotations

import uuid

from fastapi import Cookie, Depends, Header, HTTPException, status
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
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    # Authorization header takes precedence over cookie.
    # Safari and Chrome Incognito block cross-origin (third-party) cookies via ITP,
    # so clients store the token in sessionStorage and send it as a Bearer token.
    token = access_token
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") == "access" and "sub" in payload:
                user_id = uuid.UUID(payload["sub"])
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if user:
                    return user
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
