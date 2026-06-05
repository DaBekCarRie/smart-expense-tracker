"""OCR provider abstract base class."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.ocr import OCRResult


class OCRProvider(ABC):
    """All OCR backends must implement this interface."""

    @abstractmethod
    async def extract(
        self, image_bytes: bytes, categories: list[str] | None = None
    ) -> OCRResult:
        """Extract structured data from receipt image bytes.

        Args:
            image_bytes: Raw bytes of the uploaded receipt image.
            categories: Optional list of available category names.

        Returns:
            OCRResult with parsed merchant, amount, date, etc.
        """
        ...
