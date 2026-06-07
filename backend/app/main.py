from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from redis.asyncio import Redis

from app.config import settings

redis_client: Redis = None  # type: ignore[assignment]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    os.makedirs("uploads", exist_ok=True)
    yield
    await redis_client.aclose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Smart Expense Tracker API",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    os.makedirs("uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    from app.routers.auth import router as auth_router
    from app.routers.categories import router as categories_router
    from app.routers.expenses import router as expenses_router
    from app.routers.health import router as health_router
    from app.routers.ocr import router as ocr_router
    from app.api.transactions import router as transactions_router
    from app.routers.inventory import router as inventory_router
    from app.routers.shopping import router as shopping_router

    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(categories_router, prefix="/api/v1")
    app.include_router(expenses_router, prefix="/api/v1")
    app.include_router(ocr_router, prefix="/api/v1")
    app.include_router(transactions_router, prefix="/api/v1")
    app.include_router(inventory_router, prefix="/api/v1")
    app.include_router(shopping_router, prefix="/api/v1")

    return app


app = create_app()
