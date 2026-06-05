"""OCR service — Redis-cached pipeline.

Cache ordering is NON-NEGOTIABLE:
    1. MD5-hash the image bytes → cache key
    2. Check Redis — on HIT return cached OCRResult immediately
    3. On MISS — call OCR provider
    4. Store result in Redis with TTL = 3600 s
"""
from __future__ import annotations

import json
import logging

from redis.asyncio import Redis

from app.ocr.base import OCRProvider
from app.schemas.ocr import OCRResult
from app.utils.image import md5_hash

logger = logging.getLogger(__name__)

_CACHE_TTL = 3600  # 1 hour


def _build_cache_key(image_bytes: bytes) -> str:
    return f"ocr:cache:{md5_hash(image_bytes)}"


class OCRService:
    """Wraps an OCRProvider with a Redis result cache.

    Args:
        provider: Any concrete OCRProvider implementation.
    """

    def __init__(self, provider: OCRProvider) -> None:
        self.provider = provider

    async def process_receipt(
        self, image_bytes: bytes, redis: Redis, categories: list[str] | None = None
    ) -> OCRResult:
        """Return an OCRResult for *image_bytes*, consulting Redis first.

        Steps:
            1. Build cache key from MD5 hash of image bytes.
            2. Check Redis cache — return immediately on hit (cached=True).
            3. Call OCR provider on miss.
            4. Persist result in Redis with TTL=3600.
            5. Return fresh OCRResult.
        """
        cache_key = _build_cache_key(image_bytes)

        # ------------------------------------------------------------------ #
        # Step 1 — Redis cache check (MUST happen before any OCR call)        #
        # ------------------------------------------------------------------ #
        try:
            cached_raw = await redis.get(cache_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis GET failed (%s) — proceeding without cache", exc)
            cached_raw = None

        if cached_raw is not None:
            logger.debug("OCR cache HIT — key=%s", cache_key)
            try:
                data = json.loads(cached_raw)
                result = OCRResult(**data)
                result = result.model_copy(update={"cached": True})
                return result
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "Cache deserialisation failed (%s) — re-running OCR", exc
                )

        # ------------------------------------------------------------------ #
        # Step 2 — Cache miss: call OCR provider                              #
        # ------------------------------------------------------------------ #
        logger.debug("OCR cache MISS — key=%s", cache_key)
        result = await self.provider.extract(image_bytes, categories=categories)

        # ------------------------------------------------------------------ #
        # Step 3 — Store result in Redis with TTL=3600 (only if successful)   #
        # ------------------------------------------------------------------ #
        is_error = (
            "[Gemini error:" in result.raw_text or "[OpenAI error:" in result.raw_text
        )

        if not is_error:
            try:
                await redis.setex(cache_key, _CACHE_TTL, result.model_dump_json())
            except Exception as exc:  # noqa: BLE001
                logger.warning("Redis SETEX failed (%s) — result not cached", exc)
        else:
            logger.debug("Skipping cache due to OCR error")

        return result


def build_ocr_service() -> OCRService:
    """Factory: select provider based on available config at import time."""
    from app.config import settings

    if settings.OCR_PROVIDER == "gemini" or settings.GEMINI_API_KEY:
        from app.ocr.gemini_vision import GeminiVisionProvider

        provider: OCRProvider = GeminiVisionProvider(api_key=settings.GEMINI_API_KEY)
        logger.info("OCR provider: GeminiVisionProvider (gemini-2.5-flash)")
    elif settings.OPENAI_API_KEY or settings.OCR_PROVIDER == "openai":
        from app.ocr.openai_vision import OpenAIVisionProvider

        provider = OpenAIVisionProvider(api_key=settings.OPENAI_API_KEY)
        logger.info("OCR provider: OpenAIVisionProvider (gpt-4o-mini)")
    else:
        from app.ocr.tesseract_server import TesseractProvider

        provider = TesseractProvider()
        logger.info("OCR provider: TesseractProvider (local Tesseract)")

    return OCRService(provider=provider)


# Module-level singleton — created once, reused across requests
ocr_service: OCRService = build_ocr_service()
