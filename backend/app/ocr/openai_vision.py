"""OpenAI Vision OCR adapter (prod, high accuracy).

Sends the receipt image to GPT-4o-mini as a base64-encoded data URL and
expects a structured JSON response with merchant, amount, currency, and date.
Falls back to an empty OCRResult on any API error — never crashes the pipeline.
"""
from __future__ import annotations

import base64
import json
import logging
from datetime import date
from decimal import Decimal, InvalidOperation

from app.ocr.base import OCRProvider
from app.schemas.ocr import OCRResult

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a receipt OCR assistant. Extract information from the receipt image and \
return ONLY a JSON object with these exact keys (use null for any field you cannot find):

{
  "merchant": "<store or restaurant name as a string>",
  "amount": "<total amount as a numeric string, e.g. \\"12.99\\">",
  "currency": "<ISO 4217 code, e.g. USD, EUR, GBP>",
  "date": "<date in YYYY-MM-DD format>",
  "raw_text": "<all visible text on the receipt, newline-separated>",
  "confidence": <a float 0.0-1.0 reflecting your overall extraction confidence>
}

Return ONLY the JSON object, no markdown fences, no extra text.\
"""


def _parse_response(content: str) -> OCRResult:
    """Parse the model's JSON string into an OCRResult.

    Handles minor formatting issues (stray markdown fences, trailing commas).
    Returns an empty OCRResult if parsing fails.
    """
    # Strip optional markdown fences
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        data: dict = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("OpenAI OCR: JSON parse error — %s", exc)
        return OCRResult(raw_text=content, confidence=0.0)

    receipt_date: date | None = None
    raw_date = data.get("date")
    if raw_date:
        try:
            receipt_date = date.fromisoformat(str(raw_date))
        except ValueError:
            pass

    amount: Decimal | None = None
    raw_amount = data.get("amount")
    if raw_amount is not None:
        try:
            amount = Decimal(str(raw_amount))
        except InvalidOperation:
            pass

    try:
        confidence = float(data.get("confidence", 0.0))
        confidence = max(0.0, min(1.0, confidence))
    except (TypeError, ValueError):
        confidence = 0.0

    return OCRResult(
        merchant=data.get("merchant") or None,
        amount=amount,
        currency=data.get("currency") or None,
        receipt_date=receipt_date,
        raw_text=data.get("raw_text", ""),
        confidence=confidence,
    )


class OpenAIVisionProvider(OCRProvider):
    """OCR backend using GPT-4o-mini with vision capabilities.

    Uses the async OpenAI client so the call never blocks the event loop.
    On any API error the provider logs a warning and returns an empty OCRResult
    rather than propagating the exception.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        try:
            from openai import AsyncOpenAI  # type: ignore[import]

            self._client = AsyncOpenAI(api_key=api_key)
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("openai package not installed — pip install openai") from exc
        self._model = model

    async def extract(self, image_bytes: bytes) -> OCRResult:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64}"

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": data_url, "detail": "high"},
                            }
                        ],
                    },
                ],
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenAI Vision API error: %s", exc)
            return OCRResult(raw_text=f"[OpenAI error: {exc}]", confidence=0.0)

        content = response.choices[0].message.content or ""
        return _parse_response(content)
