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

from sqlalchemy import func, select, and_, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.expense import Expense
from app.models.expense_item import ExpenseItem
from app.models.product import Product
from app.models.stock_batch import StockBatch
from app.models.shopping_list import ShoppingListItem
from app.schemas.expense import ExpenseItemCreate


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
    notes: str | None = None,
    receipt_url: str | None = None,
    ocr_raw: dict | None = None,
    ocr_confidence: float | None = None,
    items: list[ExpenseItemCreate] | None = None,
) -> Expense:
    """Insert a new expense and return the refreshed ORM instance."""
    # 1. Instantiate the items beforehand to attach them in the Expense constructor
    expense_items_list = []
    if items:
        for item in items:
            exp_item = ExpenseItem(
                name=item.name,
                quantity=item.quantity,
                unit=item.unit,
                price=item.price,
                unit_price=item.unit_price,
                expiry_date=item.expiry_date,
                category_id=item.category_id,
            )
            expense_items_list.append(exp_item)

    # 2. Instantiate Expense with the pre-populated items list
    expense = Expense(
        user_id=user_id,
        merchant=merchant,
        amount=amount,
        currency=currency,
        expense_date=expense_date,
        notes=notes,
        receipt_url=receipt_url,
        ocr_raw=ocr_raw,
        ocr_confidence=ocr_confidence,
        items=expense_items_list,
    )
    db.add(expense)
    await db.flush()

    # 3. Create products, stock batches, and update the shopping list
    if items:
        for item, exp_item in zip(items, expense_items_list):
            # Find or Create the Product in Inventory
            prod_result = await db.execute(
                select(Product).where(
                    Product.user_id == user_id,
                    Product.name == item.name,
                )
            )
            product = prod_result.scalar_one_or_none()

            if not product:
                product = Product(
                    user_id=user_id,
                    name=item.name,
                    unit=item.unit or "หน่วย",
                    last_price=item.unit_price,
                    average_price=item.unit_price,
                )
                db.add(product)
                await db.flush()
            else:
                product.last_price = item.unit_price
                if item.unit:
                    product.unit = item.unit
                # Calculate average unit price of all items bought under this name
                stmt = select(func.avg(ExpenseItem.unit_price)).join(Expense).where(
                    Expense.user_id == user_id,
                    ExpenseItem.name == item.name,
                )
                avg_val = (await db.execute(stmt)).scalar()
                product.average_price = Decimal(str(avg_val)) if avg_val is not None else item.unit_price

            # Create the StockBatch with expiration date
            batch = StockBatch(
                product_id=product.id,
                quantity=item.quantity,
                expiry_date=item.expiry_date,
                source_expense_item_id=exp_item.id,
            )
            db.add(batch)

            # Auto- Shopping List link: Mark items as purchased
            await db.execute(
                update(ShoppingListItem)
                .where(
                    ShoppingListItem.user_id == user_id,
                    func.lower(ShoppingListItem.name) == func.lower(item.name),
                    ShoppingListItem.is_purchased == False,
                )
                .values(is_purchased=True)
            )

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
        select(Expense)
        .options(selectinload(Expense.items).selectinload(ExpenseItem.category))
        .where(
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
    # Load items for this expense
    await db.refresh(expense, ["items"])
    
    # Delete linked StockBatch records (created from this expense's items)
    for item in expense.items:
        batch_result = await db.execute(
            select(StockBatch).where(StockBatch.source_expense_item_id == item.id)
        )
        batches = batch_result.scalars().all()
        for batch in batches:
            product_id = batch.product_id
            await db.delete(batch)
            
            # Check if product has any remaining batches
            remaining = await db.execute(
                select(func.count()).select_from(StockBatch).where(
                    StockBatch.product_id == product_id,
                    StockBatch.id != batch.id,
                )
            )
            if remaining.scalar_one() == 0:
                # Delete orphaned product
                prod = await db.execute(
                    select(Product).where(Product.id == product_id)
                )
                product = prod.scalar_one_or_none()
                if product:
                    await db.delete(product)
    
    await db.delete(expense)


async def update_expense_item(
    db: AsyncSession,
    *,
    expense: Expense,
    item_id: uuid.UUID,
    updates: dict[str, Any],
) -> ExpenseItem:
    """Update an expense item and sync linked inventory."""
    # Find the item
    item_result = await db.execute(
        select(ExpenseItem).where(
            ExpenseItem.id == item_id,
            ExpenseItem.expense_id == expense.id,
        )
    )
    item = item_result.scalar_one_or_none()
    if item is None:
        raise ValueError("Expense item not found")
    
    old_name = item.name
    
    # Apply updates to expense item
    for key, value in updates.items():
        if key == "quantity" and value is not None:
            item.quantity = float(value)
        elif key == "unit_price" and value is not None:
            item.unit_price = Decimal(str(value))
        elif key == "price" and value is not None:
            item.price = Decimal(str(value))
        elif key == "expiry_date":
            item.expiry_date = value
        else:
            setattr(item, key, value)
    
    # Recalculate price if quantity or unit_price changed but price is not explicitly passed
    if ("quantity" in updates or "unit_price" in updates) and "price" not in updates:
        item.price = Decimal(str(item.quantity)) * item.unit_price
    
    # Sync linked inventory (StockBatch via source_expense_item_id)
    batch_result = await db.execute(
        select(StockBatch)
        .options(selectinload(StockBatch.product))
        .where(StockBatch.source_expense_item_id == item.id)
    )
    linked_batches = batch_result.scalars().all()
    
    for batch in linked_batches:
        # Update batch quantity
        if "quantity" in updates and updates["quantity"] is not None:
            batch.quantity = float(updates["quantity"])
        if "expiry_date" in updates:
            batch.expiry_date = updates["expiry_date"]
        
        # If product name changed, find or create the new product
        if "name" in updates and updates["name"] != old_name and updates["name"]:
            new_prod_result = await db.execute(
                select(Product).where(
                    Product.name == updates["name"],
                    Product.user_id == expense.user_id,
                )
            )
            new_product = new_prod_result.scalar_one_or_none()
            if not new_product:
                new_product = Product(
                    user_id=expense.user_id,
                    name=updates["name"],
                    unit=updates.get("unit", item.unit) or "หน่วย",
                    last_price=item.unit_price,
                    average_price=item.unit_price,
                )
                db.add(new_product)
                await db.flush()
            
            old_product_id = batch.product_id
            batch.product_id = new_product.id
            
            # Clean up old product if no batches remain
            remaining = await db.execute(
                select(func.count()).select_from(StockBatch).where(
                    StockBatch.product_id == old_product_id,
                    StockBatch.id != batch.id,
                )
            )
            if remaining.scalar_one() == 0:
                old_prod = await db.execute(
                    select(Product).where(Product.id == old_product_id)
                )
                old_product = old_prod.scalar_one_or_none()
                if old_product:
                    await db.delete(old_product)
        elif "unit" in updates and updates["unit"] and batch.product:
            batch.product.unit = updates["unit"]

    # Recalculate expense total
    all_items_result = await db.execute(
        select(ExpenseItem).where(ExpenseItem.expense_id == expense.id)
    )
    all_items = all_items_result.scalars().all()
    expense.amount = sum(i.price for i in all_items)
    
    await db.flush()
    return item


async def get_item_inventory_flags(
    db: AsyncSession,
    item_ids: list[uuid.UUID],
) -> set[uuid.UUID]:
    """Return the subset of item_ids that have a linked StockBatch."""
    if not item_ids:
        return set()
    result = await db.execute(
        select(StockBatch.source_expense_item_id).where(
            StockBatch.source_expense_item_id.in_(item_ids)
        )
    )
    return set(result.scalars().all())


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
        filters.append(Expense.items.any(ExpenseItem.category_id == category_id))
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
        count_filters.append(Expense.items.any(ExpenseItem.category_id == category_id))
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
        .options(selectinload(Expense.items).selectinload(ExpenseItem.category))
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
