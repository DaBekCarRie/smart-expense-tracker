"""Google Gemini Vision OCR adapter (free tier, high accuracy).

Sends the receipt image to Gemini 3.1 Flash Lite via REST API.
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
You are a receipt OCR assistant for a restaurant.
Business Context: The client is a Mala Grill & Bar restaurant (ร้านหม่าล่าปิ้งย่างและบาร์เครื่องดื่ม) that purchases food ingredients (such as meats, skewered items, fresh vegetables, seafood, Mala spices/sauces) and bar supplies/beverages (including alcohol like beer, whiskey, soda, water, ice). Use this business profile as context to help interpret, transcribe, and guess unclear, abbreviated, or missing item names and merchants on the receipt.

Extract information from the receipt image, including individual items/products purchased (useful for stock/inventory counting), and return ONLY a JSON object with these exact keys (use null for any field you cannot find):

{{
  "merchant": "<store or restaurant name as a string. If the store name is not explicitly found on the receipt, suggest a logical Thai name representing the type of purchase based on the receipt context and items, e.g., 'จ่ายตลาด', 'ร้านกาแฟ', 'ร้านขายของชำ', 'ร้านอาหาร', 'ซื้อของเข้าร้าน'>",
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
      "unit": "<ALWAYS provide a unit — infer from the item name or context if not explicit. MUST be one of these exact canonical values: kg, g, L, ml, pcs, pack, bottle, bag, box, can, unit. Mapping guide: กก./กิโลกรัม/kilo→kg | ก./กรัม/gram→g | ล./ลิตร/liter→L | มล./มิลลิลิตร→ml | ชิ้น/อัน/ตัว/เม็ด→pcs | แพ็ค/แพ็กเกจ/ถุง→pack | ขวด/bottle→bottle | ซอง/bag→bag | กล่อง/box→box | กระป๋อง/can→can | default→unit>",
      "price": "<total price for this quantity as a numeric string, e.g. \\"120.00\\">",
      "unit_price": "<price per single unit as a numeric string, e.g. \\"24.00\\">",
      "category": "<category name for this specific item — must be one of the provided categories, or null>"
    }}
  ]
}}

{category_instruction}
"""

# Normalize raw unit strings (from OCR or legacy data) to canonical keys
_UNIT_MAP: dict[str, str] = {
    # Thai kg
    "กก": "kg", "กก.": "kg", "กิโล": "kg", "กิโลกรัม": "kg", "kilo": "kg", "kilogram": "kg", "kilograms": "kg",
    # Thai g
    "ก": "g", "ก.": "g", "กรัม": "g", "gram": "g", "grams": "g",
    # Thai L
    "ล": "L", "ล.": "L", "ลิตร": "L", "liter": "L", "litre": "L", "liters": "L", "litres": "L",
    # Thai ml
    "มล": "ml", "มล.": "ml", "มิลลิลิตร": "ml", "milliliter": "ml", "millilitre": "ml",
    # pcs
    "ชิ้น": "pcs", "อัน": "pcs", "ตัว": "pcs", "เม็ด": "pcs", "piece": "pcs", "pieces": "pcs", "pc": "pcs",
    # pack
    "แพ็ค": "pack", "แพ็ก": "pack", "แพ็กเกจ": "pack", "package": "pack", "packages": "pack",
    # bottle
    "ขวด": "bottle", "bottles": "bottle",
    # bag
    "ซอง": "bag", "ถุง": "bag", "bags": "bag",
    # box
    "กล่อง": "box", "boxes": "box",
    # can
    "กระป๋อง": "can", "cans": "can",
    # default / fallback
    "หน่วย": "unit", "units": "unit",
}

_CANONICAL_UNITS = {"kg", "g", "L", "ml", "pcs", "pack", "bottle", "bag", "box", "can", "unit"}


def _normalize_unit(raw: str | None) -> str:
    """Map any unit string to a canonical key; fall back to 'unit'."""
    if not raw:
        return "unit"
    stripped = raw.strip()
    if stripped in _CANONICAL_UNITS:
        return stripped
    return _UNIT_MAP.get(stripped, _UNIT_MAP.get(stripped.lower(), "unit"))

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

            unit = _normalize_unit(item.get("unit"))

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

            item_category = item.get("category") or None

            items_list.append(
                OCRItemSchema(
                    name=item_name,
                    quantity=quantity,
                    unit=unit,
                    price=item_price,
                    unit_price=unit_price or item_price,
                    category=item_category,
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
    """OCR backend using Google Gemini 2.5 Flash via REST API."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        if not api_key:
            raise ValueError("GEMINI_API_KEY must be provided")
        self._api_key = api_key
        self._model = model
        # Fallback chain — all are real, released Gemini model IDs
        self._models_to_try = [
            model,
            "gemini-2.5-flash-lite-preview-06-17",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
        ]
        # Deduplicate while preserving order
        seen: set[str] = set()
        self._models_to_try = [x for x in self._models_to_try if not (x in seen or seen.add(x))]

    async def extract(
        self, image_bytes: bytes, categories: list[str] | None = None
    ) -> OCRResult:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        category_instruction = ""
        if categories:
            category_instruction = (
                f"IMPORTANT: For EACH item in the 'items' array, set its 'category' field "
                f"to the best matching category from this exact list: {', '.join(categories)}. "
                f"You MUST only use names from this list exactly as written. If no category fits, use null."
            )
        else:
            category_instruction = (
                "For each item in the 'items' array, set a 'category' field with a logical "
                "category name (e.g. Meat, Vegetables, Seafood, Beverages, Supplies, Condiments)."
            )

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

        last_exception = None
        data = None
        successful_model = None

        try:
            async with httpx.AsyncClient() as client:
                for model_name in self._models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self._api_key}"
                    try:
                        response = await client.post(url, json=payload, timeout=30.0)
                        response.raise_for_status()
                        data = response.json()
                        successful_model = model_name
                        break
                    except Exception as exc:  # noqa: BLE001
                        logger.warning(
                            "Gemini Vision API error with model %s: %s. Trying fallback...",
                            model_name,
                            exc,
                        )
                        last_exception = exc
        except Exception as exc:  # noqa: BLE001
            last_exception = exc

        if data is None:
            return OCRResult(raw_text=f"[Gemini error: All models failed. Last error: {last_exception}]", confidence=0.0)

        if successful_model != self._model:
            logger.info("Successfully fell back to Gemini model: %s", successful_model)

        try:
            # Extract text from Gemini response structure
            content = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.warning("Unexpected Gemini response structure: %s", data)
            return OCRResult(raw_text="[Gemini error: Unexpected response structure]", confidence=0.0)

        return _parse_response(content)
