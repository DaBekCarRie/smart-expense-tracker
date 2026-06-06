"""Expenses router — full CRUD with cursor-based pagination.

Registered at /api/v1/expenses in app/main.py.

API Contract:
| Method | Endpoint              | Auth? | Request Body    | Response Schema    |
|--------|-----------------------|-------|-----------------|--------------------|
| POST   | /expenses             | Yes   | ExpenseCreate   | ExpenseOut         |
| GET    | /expenses             | Yes   | query params    | CursorPage[ExpOut] |
| GET    | /expenses/{id}        | Yes   | —               | ExpenseOut         |
| PUT    | /expenses/{id}        | Yes   | ExpenseUpdate   | ExpenseOut         |
| DELETE | /expenses/{id}        | Yes   | —               | {"message": str}   |
"""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.expense import CursorPage, ExpenseCreate, ExpenseOut, ExpenseUpdate, ExpenseItemUpdate
from app.services.expense_service import (
    create_expense,
    delete_expense,
    get_expense_by_id,
    get_item_inventory_flags,
    list_expenses_cursor,
    update_expense,
    update_expense_item,
)


async def _to_expense_out(db: AsyncSession, expense) -> ExpenseOut:
    """Build ExpenseOut with has_inventory flags set on each item."""
    out = ExpenseOut.model_validate(expense)
    if out.items:
        flagged = await get_item_inventory_flags(db, [i.id for i in out.items])
        for item in out.items:
            item.has_inventory = item.id in flagged
    return out

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create(
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = await create_expense(
        db,
        user_id=current_user.id,
        merchant=body.merchant,
        amount=body.amount,
        currency=body.currency,
        expense_date=body.expense_date,
        notes=body.notes,
        receipt_url=body.receipt_url,
        items=body.items,
    )
    await db.commit()
    expense_loaded = await get_expense_by_id(db, expense_id=expense.id, user_id=current_user.id)
    if expense_loaded is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return await _to_expense_out(db, expense_loaded)


@router.get("", response_model=CursorPage[ExpenseOut])
async def list_expenses(
    category_id: int | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    cursor: str | None = Query(default=None, description="Opaque pagination cursor"),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CursorPage[ExpenseOut]:
    result = await list_expenses_cursor(
        db,
        user_id=current_user.id,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
        cursor=cursor,
        limit=limit,
    )
    out_items = [await _to_expense_out(db, e) for e in result["items"]]
    return CursorPage(
        items=out_items,
        next_cursor=result["next_cursor"],
        has_more=result["has_more"],
        total=result["total"],
    )


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_one(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = await get_expense_by_id(db, expense_id=expense_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return await _to_expense_out(db, expense)


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update(
    expense_id: uuid.UUID,
    body: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = await get_expense_by_id(db, expense_id=expense_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    updates = body.model_dump(exclude_unset=True)
    expense = await update_expense(db, expense=expense, updates=updates)
    await db.commit()
    expense_loaded = await get_expense_by_id(db, expense_id=expense.id, user_id=current_user.id)
    if expense_loaded is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return await _to_expense_out(db, expense_loaded)


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
async def delete(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    expense = await get_expense_by_id(db, expense_id=expense_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    await delete_expense(db, expense=expense)
    await db.commit()
    return {"message": f"Expense {expense_id} deleted"}


@router.put("/{expense_id}/items/{item_id}", response_model=ExpenseOut)
async def update_item(
    expense_id: uuid.UUID,
    item_id: uuid.UUID,
    body: ExpenseItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseOut:
    expense = await get_expense_by_id(db, expense_id=expense_id, user_id=current_user.id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    
    updates = body.model_dump(exclude_unset=True)
    try:
        await update_expense_item(db, expense=expense, item_id=item_id, updates=updates)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
    await db.commit()
    expense_loaded = await get_expense_by_id(db, expense_id=expense.id, user_id=current_user.id)
    if expense_loaded is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return await _to_expense_out(db, expense_loaded)
