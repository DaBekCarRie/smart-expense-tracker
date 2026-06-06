from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.stock_batch import StockBatch
from app.models.user import User
from app.schemas.inventory import ProductMinStockUpdate, ProductOut, ProductStockAdjust

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[ProductOut])
async def list_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all products in stock with their details and batches."""
    stmt = (
        select(Product)
        .options(selectinload(Product.batches))
        .where(Product.user_id == current_user.id)
        .order_by(Product.name.asc())
    )
    result = await db.execute(stmt)
    products = list(result.scalars().all())

    out_list = []
    for p in products:
        total_stock = sum(b.quantity for b in p.batches)
        p_out = ProductOut.model_validate(p)
        p_out.current_stock = total_stock
        out_list.append(p_out)

    return out_list


@router.put("/{product_id}/adjust", response_model=ProductOut)
async def adjust_stock(
    product_id: uuid.UUID,
    body: ProductStockAdjust,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually add or consume stock.

    Deducting stock (quantity_change < 0) uses FIFO based on expiration date.
    Adding stock (quantity_change > 0) creates a new batch.
    """
    stmt = (
        select(Product)
        .options(selectinload(Product.batches))
        .where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    if body.quantity_change > 0:
        # Create a new batch for positive adjustments
        batch = StockBatch(product_id=product.id, quantity=body.quantity_change)
        db.add(batch)
    elif body.quantity_change < 0:
        # Deduct from batches using FIFO (earliest expiry first, None values last)
        to_deduct = abs(body.quantity_change)
        active_batches = [b for b in product.batches if b.quantity > 0]
        active_batches.sort(
            key=lambda b: (b.expiry_date is None, b.expiry_date, b.created_at)
        )

        for batch in active_batches:
            if to_deduct <= 0:
                break
            if batch.quantity >= to_deduct:
                batch.quantity -= to_deduct
                to_deduct = 0
            else:
                to_deduct -= batch.quantity
                batch.quantity = 0

        # Clean up batches that reached 0
        for batch in product.batches:
            if batch.quantity <= 0:
                await db.delete(batch)

    await db.commit()
    await db.refresh(product)

    # Re-calculate stock
    total_stock = sum(b.quantity for b in product.batches)
    p_out = ProductOut.model_validate(product)
    p_out.current_stock = total_stock
    return p_out


@router.put("/{product_id}/min-stock", response_model=ProductOut)
async def update_min_stock(
    product_id: uuid.UUID,
    body: ProductMinStockUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set the minimum stock level trigger for reordering."""
    stmt = (
        select(Product)
        .options(selectinload(Product.batches))
        .where(Product.id == product_id, Product.user_id == current_user.id)
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    product.min_stock = body.min_stock
    await db.commit()
    await db.refresh(product)

    total_stock = sum(b.quantity for b in product.batches)
    p_out = ProductOut.model_validate(product)
    p_out.current_stock = total_stock
    return p_out


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a product and all its inventory batches."""
    stmt = select(Product).where(
        Product.id == product_id, Product.user_id == current_user.id
    )
    product = (await db.execute(stmt)).scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )

    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted successfully"}
