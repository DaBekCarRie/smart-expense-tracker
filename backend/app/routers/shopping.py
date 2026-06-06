from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.shopping_list import ShoppingListItem
from app.models.user import User
from app.schemas.shopping import ShoppingListItemCreate, ShoppingListItemOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])


@router.get("", response_model=list[ShoppingListItemOut])
async def list_shopping_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all shopping list items for the user, sorted by purchase status and date."""
    stmt = (
        select(ShoppingListItem)
        .where(ShoppingListItem.user_id == current_user.id)
        .order_by(ShoppingListItem.is_purchased.asc(), ShoppingListItem.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=ShoppingListItemOut, status_code=status.HTTP_201_CREATED)
async def create_shopping_item(
    body: ShoppingListItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new item to the shopping list."""
    item = ShoppingListItem(
        user_id=current_user.id,
        name=body.name,
        quantity=body.quantity,
        unit=body.unit,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.put("/{item_id}/toggle", response_model=ShoppingListItemOut)
async def toggle_shopping_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle the purchased state of a shopping list item."""
    stmt = select(ShoppingListItem).where(
        ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id
    )
    item = (await db.execute(stmt)).scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found"
        )

    item.is_purchased = not item.is_purchased
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_shopping_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a shopping list item."""
    stmt = select(ShoppingListItem).where(
        ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id
    )
    item = (await db.execute(stmt)).scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found"
        )

    await db.delete(item)
    await db.commit()
    return {"message": "Shopping item deleted successfully"}


@router.post("/auto-generate", response_model=list[ShoppingListItemOut])
async def auto_generate_shopping_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Scan inventory and auto-add products falling below minimum stock thresholds."""
    # Load all products with min_stock defined and their current batches
    stmt = (
        select(Product)
        .options(selectinload(Product.batches))
        .where(
            Product.user_id == current_user.id,
            Product.min_stock.is_not(None)
        )
    )
    products = list((await db.execute(stmt)).scalars().all())

    added_items = []
    for p in products:
        total_stock = sum(b.quantity for b in p.batches)
        if total_stock < p.min_stock:
            # Check if this item is already on the shopping list (unpurchased)
            check_stmt = select(ShoppingListItem).where(
                ShoppingListItem.user_id == current_user.id,
                func.lower(ShoppingListItem.name) == func.lower(p.name),
                ShoppingListItem.is_purchased == False,
            )
            exists = (await db.execute(check_stmt)).scalar_one_or_none()

            if not exists:
                needed_qty = p.min_stock - total_stock
                new_item = ShoppingListItem(
                    user_id=current_user.id,
                    name=p.name,
                    quantity=needed_qty,
                    unit=p.unit,
                )
                db.add(new_item)
                added_items.append(new_item)

    if added_items:
        await db.commit()
        for item in added_items:
            await db.refresh(item)

    return added_items
