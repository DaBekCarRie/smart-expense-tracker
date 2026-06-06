"""Google Gemini Vision OCR adapter (free tier, high accuracy).

Sends the receipt image to Gemini 1.5 Flash via REST API.
Expects a structured JSON response with merchant, amount, currency, and date.
"""
from __future__ import annotations

import base64
import json
import logging
from datetime import date
from decimal import Decimal, InvalidOperation

import httpx

from app.ocr.base import OCRProvider
from app.schemas.ocr import OCRResult, OCRItemSchema

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a receipt OCR assistant. Extract information from the receipt image, including individual items/products purchased (useful for stock/inventory counting), and return ONLY a JSON object with these exact keys (use null for any field you cannot find):

{{
  "merchant": "<store or restaurant name as a string>",
  "amount": "<total amount of the receipt as a numeric string, e.g. \\"12.99\\">",
  "currency": "<ISO 4217 code, e.g. USD, EUR, GBP, THB, or null if unknown>",
  "date": "<date in YYYY-MM-DD format>",
  "category": "<category name as a string>",
  "raw_text": "<all visible text on the receipt, newline-separated>",
  "confidence": <a float 0.0-1.0 reflecting your overall extraction confidence>,
  "items": [
    {{
      "name": "<name of the product/item, e.g. \\"ซอสหอยนางรม 1 กก.\\">",
      "quantity": <quantity purchased as a float or integer, e.g. 5>,
      "unit": "<the unit description if specified, e.g. \\"หน่วย\\", \\"แพ็ค\\", \\"ขวด\\", or null>",
      "price": "<total price for this quantity as a numeric string, e.g. \\"120.00\\">",
      "unit_price": "<price per single unit as a numeric string, e.g. \\"24.00\\">"
    }}
  ]
}}

{category_instruction}
"""

def _parse_response(content: str) -> OCRResult:
    """Parse the model's JSON string into an OCRResult."""
    text = content.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        data: dict = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("Gemini OCR: JSON parse error — %s", exc)
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

    items_list: list[OCRItemSchema] = []
    raw_items = data.get("items")
    if isinstance(raw_items, list):
        for item in raw_items:
            if not isinstance(item, dict) or "name" not in item:
                continue
            item_name = str(item["name"])
            if not item_name.strip():
                continue

            try:
                quantity = float(item.get("quantity", 1.0))
            except (TypeError, ValueError):
                quantity = 1.0

            unit = item.get("unit")
            unit = str(unit) if unit else None

            item_price = None
            raw_price = item.get("price")
            if raw_price is not None:
                try:
                    item_price = Decimal(str(raw_price))
                except InvalidOperation:
                    pass

            unit_price = None
            raw_unit_price = item.get("unit_price")
            if raw_unit_price is not None:
                try:
                    unit_price = Decimal(str(raw_unit_price))
                except InvalidOperation:
                    pass
            elif item_price is not None and quantity > 0:
                unit_price = item_price / Decimal(str(quantity))

            items_list.append(
                OCRItemSchema(
                    name=item_name,
                    quantity=quantity,
                    unit=unit,
                    price=item_price,
                    unit_price=unit_price or item_price,
                )
            )

    return OCRResult(
        merchant=data.get("merchant") or None,
        amount=amount,
        currency=data.get("currency") or None,
        receipt_date=receipt_date,
        category=data.get("category") or None,
        raw_text=data.get("raw_text", ""),
        confidence=confidence,
        items=items_list,
    )


class GeminiVisionProvider(OCRProvider):
    """OCR backend using Google Gemini 1.5/2.5 Flash via REST API."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY must be provided")
        self._api_key = api_key
        self._model = model
        self._url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent?key={self._api_key}"

    async def extract(
        self, image_bytes: bytes, categories: list[str] | None = None
    ) -> OCRResult:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        category_instruction = ""
        if categories:
            category_instruction = f"IMPORTANT: For the 'category' field, you MUST choose the best match from this list: {', '.join(categories)}."
        else:
            category_instruction = "For the 'category' field, suggest a logical category (e.g. Dining, Groceries, Transport)."

        system_prompt = _SYSTEM_PROMPT.format(category_instruction=category_instruction)

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": system_prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self._url, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning("Gemini Vision API error: %s", exc)
            return OCRResult(raw_text=f"[Gemini error: {exc}]", confidence=0.0)

        try:
            # Extract text from Gemini response structure
            content = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.warning("Unexpected Gemini response structure: %s", data)
            return OCRResult(raw_text="[Gemini error: Unexpected response structure]", confidence=0.0)

        return _parse_response(content)
