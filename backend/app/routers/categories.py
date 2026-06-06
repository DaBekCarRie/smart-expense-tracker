from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryOut
from app.services import category_service
from app.services.storage_service import storage_service
from app.utils.image import validate_image

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"
    icon: str | None = "Tag"


@router.get("", response_model=list[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.user_id == current_user.id).order_by(Category.name)
    )
    return result.scalars().all()


@router.post("/seed", response_model=list[CategoryOut])
async def seed_categories(
    locale: str = Query(default="en", regex="^(en|th)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Seed default categories for the current user in the requested locale."""
    return await category_service.seed_default_categories(db, current_user.id, locale=locale)


@router.post("/upload-icon")
async def upload_category_icon(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a custom icon for a category."""
    try:
        # Read first so we can validate the actual byte count (file.size is unreliable)
        buf = await file.read()
        validate_image(file.content_type or "image/jpeg", len(buf))

        icon_url = await storage_service.save_icon(buf, file.filename or "icon.jpg")
        return {"icon_url": icon_url}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload icon")


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = Category(user_id=current_user.id, name=body.name, color=body.color, icon=body.icon)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: int,
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    cat.name = body.name
    cat.color = body.color
    cat.icon = body.icon
    await db.commit()
    await db.refresh(cat)
    return CategoryOut.model_validate(cat)


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await db.delete(cat)
    await db.commit()
    return {"message": f"Category {category_id} deleted"}
