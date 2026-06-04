"""Image utilities used by the OCR pipeline.

md5_hash        — deterministic cache key for image bytes
validate_image  — raises ValueError for unsupported types or oversized files
compress_image  — resize + re-encode as JPEG using Pillow
"""
from __future__ import annotations

import hashlib
import io

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
_COMPRESS_THRESHOLD_BYTES = 2 * 1024 * 1024  # 2 MB — compress if larger


def md5_hash(image_bytes: bytes) -> str:
    """Return the hex MD5 digest of *image_bytes* for use as a Redis cache key."""
    return hashlib.md5(image_bytes).hexdigest()  # noqa: S324 (MD5 fine for cache keys)


def validate_image(content_type: str, size: int) -> None:
    """Raise ValueError if the image is unsupported or too large.

    Args:
        content_type: MIME type reported by the upload (e.g. "image/jpeg").
        size:         Number of bytes in the upload.

    Raises:
        ValueError: with a descriptive message.
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported image type '{content_type}'. "
            f"Allowed types: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
        )
    if size > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(
            f"Image too large ({size / 1024 / 1024:.1f} MB). "
            f"Maximum allowed size is {MAX_IMAGE_SIZE_BYTES // 1024 // 1024} MB."
        )


def compress_image(
    data: bytes,
    max_width: int = 1920,
    quality: int = 85,
) -> bytes:
    """Resize and compress *data* to a JPEG, keeping the aspect ratio.

    If Pillow is not installed the original bytes are returned unchanged
    so the OCR pipeline can still proceed (with a logged warning).

    Args:
        data:      Raw image bytes (any format Pillow understands).
        max_width: Maximum width in pixels; taller images are scaled down
                   proportionally.  Default 1920 px.
        quality:   JPEG compression quality (1-95).  Default 85.

    Returns:
        JPEG-encoded bytes, possibly smaller than the input.
    """
    try:
        from PIL import Image  # type: ignore[import]
    except ImportError:
        import logging
        logging.getLogger(__name__).warning(
            "Pillow not installed — skipping image compression"
        )
        return data

    with Image.open(io.BytesIO(data)) as img:
        # Convert palette / RGBA images to RGB for JPEG encoding
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        width, height = img.size
        if width > max_width:
            new_height = int(height * max_width / width)
            img = img.resize((max_width, new_height), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue()
