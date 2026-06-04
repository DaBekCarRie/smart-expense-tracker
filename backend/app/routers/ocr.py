"""OCR router — Redis-cached pipeline.

API Contract:
| Method | Endpoint        | Auth? | Request                     | Response           |
|--------|-----------------|-------|-----------------------------|--------------------|
| POST   | /ocr/upload     | Yes   | multipart/form-data (file)  | OCRUploadResponse  |
"""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from redis.asyncio import Redis

from app.dependencies import get_current_user, get_redis
from app.schemas.ocr import OCRUploadResponse
from app.services.ocr_service import ocr_service
from app.utils.image import (
    _COMPRESS_THRESHOLD_BYTES,
    compress_image,
    validate_image,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["ocr"])

_MAX_SIZE = 10 * 1024 * 1024  # 10 MB — enforced before reading full bytes


@router.post(
    "/upload",
    response_model=OCRUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload a receipt image for OCR processing",
)
async def upload_receipt(
    file: UploadFile = File(..., description="Receipt image (JPEG, PNG, WebP, GIF)"),
    current_user=Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> OCRUploadResponse:
    """Process an uploaded receipt image through the Redis-cached OCR pipeline.

    - Validates content-type and file size (max 10 MB).
    - Compresses images larger than 2 MB to JPEG @ 85 quality / 1920 px max width.
    - Returns cached OCRResult if the same image has been processed before.
    """
    # ------------------------------------------------------------------ #
    # 1. Content-type validation                                           #
    # ------------------------------------------------------------------ #
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported media type '{content_type}'. Only image/* types are accepted.",
        )

    # ------------------------------------------------------------------ #
    # 2. Read file bytes + size guard                                      #
    # ------------------------------------------------------------------ #
    image_bytes = await file.read()
    file_size = len(image_bytes)

    try:
        validate_image(content_type, file_size)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            if "too large" in str(exc).lower()
            else status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc

    # ------------------------------------------------------------------ #
    # 3. Optional compression (> 2 MB)                                    #
    # ------------------------------------------------------------------ #
    if file_size > _COMPRESS_THRESHOLD_BYTES:
        logger.debug(
            "Compressing image from %.1f MB before OCR",
            file_size / 1024 / 1024,
        )
        image_bytes = compress_image(image_bytes)

    # ------------------------------------------------------------------ #
    # 4. OCR pipeline (cache-first, enforced inside ocr_service)          #
    # ------------------------------------------------------------------ #
    t0 = time.monotonic()
    result = await ocr_service.process_receipt(image_bytes, redis)
    elapsed_ms = (time.monotonic() - t0) * 1000
    result = result.model_copy(update={"processing_time_ms": elapsed_ms})

    logger.info(
        "OCR complete — user=%s cached=%s confidence=%.2f elapsed_ms=%.1f",
        current_user.id,
        result.cached,
        result.confidence,
        elapsed_ms,
    )

    return OCRUploadResponse.from_result(result)
