"""Expense / Transaction business-logic service.

Encapsulates all DB operations so routers stay thin.
Uses cursor-based pagination backed by idx_expenses_user_date compound index.

Cursor format (base64-encoded JSON): {"d": "YYYY-MM-DD", "id": "<uuid>"}
"""
from __future__ import annotations

import base64
import json
import uuid
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense


# ---------------------------------------------------------------------------
# Cursor helpers
# ---------------------------------------------------------------------------

def encode_cursor(expense_date: date, expense_id: uuid.UUID) -> str:
    raw = json.dumps({"d": expense_date.isoformat(), "id": str(expense_id)})
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[date, uuid.UUID]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode()).decode()
        data = json.loads(raw)
        return date.fromisoformat(data["d"]), uuid.UUID(data["id"])
    except Exception as exc:
        raise ValueError(f"Invalid cursor: {cursor}") from exc


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------

async def create_expense(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    merchant: str,
    amount: Decimal,
    currency: str = "USD",
    expense_date: date,
    category_id: int | None = None,
    notes: str | None = None,
    receipt_url: str | None = None,
    ocr_raw: dict | None = None,
    ocr_confidence: float | None = None,
) -> Expense:
    """Insert a new expense and return the refreshed ORM instance."""
    expense = Expense(
        user_id=user_id,
        merchant=merchant,
        amount=amount,
        currency=currency,
        expense_date=expense_date,
        category_id=category_id,
        notes=notes,
        receipt_url=receipt_url,
        ocr_raw=ocr_raw,
        ocr_confidence=ocr_confidence,
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense


async def get_expense_by_id(
    db: AsyncSession,
    *,
    expense_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Expense | None:
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def update_expense(
    db: AsyncSession,
    *,
    expense: Expense,
    updates: dict[str, Any],
) -> Expense:
    """Apply *updates* dict to *expense* and flush."""
    for key, value in updates.items():
        setattr(expense, key, value)
    await db.flush()
    await db.refresh(expense)
    return expense


async def delete_expense(db: AsyncSession, *, expense: Expense) -> None:
    await db.delete(expense)


async def list_expenses_cursor(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    category_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    cursor: str | None = None,
    limit: int = 20,
) -> dict:
    """Cursor-based paginated query using idx_expenses_user_date index.

    Returns:
        {
            "items": list[Expense],
            "next_cursor": str | None,
            "has_more": bool,
            "total": int,
        }
    """
    filters = [Expense.user_id == user_id]

    if category_id is not None:
        filters.append(Expense.category_id == category_id)
    if date_from is not None:
        filters.append(Expense.expense_date >= date_from)
    if date_to is not None:
        filters.append(Expense.expense_date <= date_to)
    if cursor is not None:
        cur_date, cur_id = decode_cursor(cursor)
        # Keyset pagination: fetch rows before the cursor position
        filters.append(
            or_(
                Expense.expense_date < cur_date,
                and_(
                    Expense.expense_date == cur_date,
                    Expense.id < cur_id,
                )
            )
        )

    base_q = select(Expense).where(*filters)

    # Total count (ignores cursor)
    count_filters = [Expense.user_id == user_id]
    if category_id is not None:
        count_filters.append(Expense.category_id == category_id)
    if date_from is not None:
        count_filters.append(Expense.expense_date >= date_from)
    if date_to is not None:
        count_filters.append(Expense.expense_date <= date_to)

    total: int = (
        await db.execute(
            select(func.count()).where(*count_filters).select_from(Expense)
        )
    ).scalar_one()

    # Fetch limit+1 to detect has_more
    data_q = (
        base_q
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .limit(limit + 1)
    )
    rows = list((await db.execute(data_q)).scalars().all())

    has_more = len(rows) > limit
    items = rows[:limit]
    next_cursor: str | None = None
    if has_more and items:
        last = items[-1]
        next_cursor = encode_cursor(last.expense_date, last.id)

    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more,
        "total": total,
    }
