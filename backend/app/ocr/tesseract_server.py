"""Tesseract OCR adapter (dev default, no API key required).

Runs pytesseract in a thread-pool executor so it never blocks the event loop.
Parses merchant, amount, and date from the raw OCR text using regex heuristics.
"""
from __future__ import annotations

import asyncio
import io
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from functools import partial

from app.ocr.base import OCRProvider
from app.schemas.ocr import OCRResult

# ---------------------------------------------------------------------------
# Optional pytesseract import — gracefully unavailable in environments that
# don't have Tesseract installed (CI, some Docker images, etc.)
# ---------------------------------------------------------------------------
try:
    import pytesseract
    from PIL import Image as PILImage

    _TESSERACT_AVAILABLE = True
except ImportError:  # pragma: no cover
    _TESSERACT_AVAILABLE = False


# ---------------------------------------------------------------------------
# Regex patterns for parsing receipt text
# ---------------------------------------------------------------------------

# Merchant: first non-empty line that is mostly letters
_MERCHANT_RE = re.compile(r"^[A-Za-z][A-Za-z0-9\s&'.,\-]{2,}$")

# Amount: optional currency symbol, digits, optional cents
_AMOUNT_RE = re.compile(
    r"(?:total|amount|subtotal|due|pay|charged)[^\d$€£¥]*"
    r"([\$€£¥]?\s?\d{1,7}(?:[.,]\d{2})?)",
    re.IGNORECASE,
)
# Fallback: any standalone currency-like value
_AMOUNT_FALLBACK_RE = re.compile(r"[\$€£¥]\s?\d{1,7}(?:[.,]\d{2})?")

# Date: several common receipt date formats
_DATE_PATTERNS = [
    (re.compile(r"\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b"), "%m/%d/%Y"),
    (re.compile(r"\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b"), "%Y/%m/%d"),
    (re.compile(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b", re.IGNORECASE), None),
]

_MONTH_ABBREV = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

# Currency symbols/codes
_CURRENCY_MAP = {"$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY"}


def _parse_text(raw_text: str) -> tuple[str | None, Decimal | None, str | None, date | None, float]:
    """Return (merchant, amount, currency, date, confidence) parsed from raw OCR text."""
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]

    # --- merchant: first plausible header line ---
    merchant: str | None = None
    for line in lines[:8]:
        if _MERCHANT_RE.match(line):
            merchant = line
            break

    # --- amount ---
    amount: Decimal | None = None
    currency: str | None = None
    m = _AMOUNT_RE.search(raw_text)
    if not m:
        m = _AMOUNT_FALLBACK_RE.search(raw_text)
        raw_amount = m.group(0) if m else None
    else:
        raw_amount = m.group(1)

    if raw_amount:
        sym = raw_amount[0] if raw_amount and raw_amount[0] in _CURRENCY_MAP else None
        if sym:
            currency = _CURRENCY_MAP[sym]
        digits = re.sub(r"[^\d.]", "", raw_amount.replace(",", "."))
        try:
            amount = Decimal(digits)
        except InvalidOperation:
            amount = None

    # --- date ---
    receipt_date: date | None = None
    for pattern, fmt in _DATE_PATTERNS:
        dm = pattern.search(raw_text)
        if not dm:
            continue
        try:
            if fmt is None:
                # "15 Jan 2024" style
                day, month_str, year = dm.group(1), dm.group(2).lower()[:3], dm.group(3)
                month = _MONTH_ABBREV.get(month_str)
                if month:
                    receipt_date = date(int(year), month, int(day))
            else:
                sep = "/" if "/" in dm.group(0) else "-"
                normalized = dm.group(0).replace("-", "/")
                receipt_date = datetime.strptime(normalized, fmt.replace("-", "/")).date()
        except (ValueError, KeyError):
            continue
        if receipt_date:
            break

    # --- confidence heuristic ---
    fields_found = sum([merchant is not None, amount is not None, receipt_date is not None])
    confidence = fields_found / 3.0

    return merchant, amount, currency, receipt_date, confidence


def _run_tesseract(image_bytes: bytes) -> str:
    """Blocking call — must be run in executor."""
    if not _TESSERACT_AVAILABLE:
        raise RuntimeError("pytesseract / Pillow not installed")
    image = PILImage.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(image)


class TesseractProvider(OCRProvider):
    """OCR backend using the local Tesseract engine.

    pytesseract.image_to_string is a blocking CPU/IO call, so it is dispatched
    to a thread-pool executor to avoid blocking the asyncio event loop.
    """

    async def extract(self, image_bytes: bytes) -> OCRResult:
        loop = asyncio.get_running_loop()
        try:
            raw_text: str = await loop.run_in_executor(None, partial(_run_tesseract, image_bytes))
        except Exception as exc:  # noqa: BLE001
            # Tesseract unavailable or crashed — return empty result
            return OCRResult(
                raw_text=f"[TesseractProvider error: {exc}]",
                confidence=0.0,
            )

        merchant, amount, currency, receipt_date, confidence = _parse_text(raw_text)

        return OCRResult(
            merchant=merchant,
            amount=amount,
            currency=currency or "USD",
            receipt_date=receipt_date,
            raw_text=raw_text,
            confidence=confidence,
        )
