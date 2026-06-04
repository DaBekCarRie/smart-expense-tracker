"""Transactions CRUD router.

Maps to /api/v1/transactions.  Uses the Expense ORM model (the canonical
storage table) and the Transaction* Pydantic schemas.

API Contract:
| Method | Endpoint                    | Auth? | Request Body          | Response Schema           |
|--------|-----------------------------|-------|-----------------------|---------------------------|
| POST   | /transactions               | Yes   | TransactionCreate     | TransactionResponse       |
| GET    | /transactions               | Yes   | query params (filter) | TransactionListResponse   |
| GET    | /transactions/{id}          | Yes   | —                     | TransactionResponse       |
| PUT    | /transactions/{id}          | Yes   | TransactionUpdate     | TransactionResponse       |
| DELETE | /transactions/{id}          | Yes   | —                     | {"message": str}          |
"""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.expense import Expense
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.expense_service import (
    create_expense,
    get_expense_by_id,
    list_expenses_cursor,
    update_expense,
    delete_expense,
)
from app.schemas.expense import CursorPage

router = APIRouter(prefix="/transactions", tags=["transactions"])


# ---------------------------------------------------------------------------
# POST /transactions
# ---------------------------------------------------------------------------

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create(
    body: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    """Create a new transaction for the authenticated user."""
    expense = await create_expense(
        db,
        user_id=current_user.id,
        merchant=body.merchant,
        amount=body.amount,
        currency=body.currency,
        expense_date=body.expense_date,
        category_id=body.category_id,
        notes=body.notes,
    )
    await db.commit()
    await db.refresh(expense)
    return TransactionResponse.model_validate(expense)


# ---------------------------------------------------------------------------
# GET /transactions
# ---------------------------------------------------------------------------

@router.get("", response_model=CursorPage[TransactionResponse])
async def list_txns(
    category_id: int | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CursorPage[TransactionResponse]:
    """List transactions with cursor pagination."""
    result = await list_expenses_cursor(
        db,
        user_id=current_user.id,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        cursor=cursor,
        limit=limit,
    )
    return CursorPage(
        items=[TransactionResponse.model_validate(r) for r in result["items"]],
        next_cursor=result["next_cursor"],
        has_more=result["has_more"],
        total=result["total"],
    )


# ---------------------------------------------------------------------------
# GET /transactions/{id}
# ---------------------------------------------------------------------------

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    """Fetch a single transaction by ID."""
    expense = await get_expense_by_id(db, expense_id=transaction_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return TransactionResponse.model_validate(expense)


# ---------------------------------------------------------------------------
# PUT /transactions/{id}
# ---------------------------------------------------------------------------

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_txn(
    transaction_id: uuid.UUID,
    body: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionResponse:
    """Update a transaction (partial update)."""
    expense = await get_expense_by_id(db, expense_id=transaction_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    updates = body.model_dump(exclude_unset=True)
    expense = await update_expense(db, expense=expense, updates=updates)
    await db.commit()
    await db.refresh(expense)
    return TransactionResponse.model_validate(expense)


# ---------------------------------------------------------------------------
# DELETE /transactions/{id}
# ---------------------------------------------------------------------------

@router.delete("/{transaction_id}", status_code=status.HTTP_200_OK)
async def delete_txn(
    transaction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a transaction by ID."""
    expense = await get_expense_by_id(db, expense_id=transaction_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    await delete_expense(db, expense=expense)
    await db.commit()
    return {"message": f"Transaction {transaction_id} deleted"}
