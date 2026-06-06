from __future__ import annotations

import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category

DEFAULT_CATEGORIES_EN = [
    {"name": "Food & Drink", "color": "#ffb6b9", "icon": "Utensils"},
    {"name": "Grocery", "color": "#b8e6b3", "icon": "ShoppingBag"},
    {"name": "Transport", "color": "#b5d8f7", "icon": "Car"},
    {"name": "Rent & Housing", "color": "#ffd1a9", "icon": "Home"},
    {"name": "Shopping", "color": "#e1ccfa", "icon": "Tag"},
    {"name": "Utilities", "color": "#fdfd96", "icon": "Zap"},
    {"name": "Health", "color": "#ffb6b9", "icon": "Heart"},
    {"name": "Entertainment", "color": "#b5d8f7", "icon": "Film"},
    {"name": "Work", "color": "#e1ccfa", "icon": "Briefcase"},
    {"name": "Other", "color": "#84cc16", "icon": "Tag"},
]

DEFAULT_CATEGORIES_TH = [
    {"name": "อาหาร & เครื่องดื่ม", "color": "#ffb6b9", "icon": "Utensils"},
    {"name": "ของชำ / ของสด", "color": "#b8e6b3", "icon": "ShoppingBag"},
    {"name": "ค่าเดินทาง", "color": "#b5d8f7", "icon": "Car"},
    {"name": "ค่าเช่า / ที่อยู่อาศัย", "color": "#ffd1a9", "icon": "Home"},
    {"name": "ช้อปปิ้ง", "color": "#e1ccfa", "icon": "Tag"},
    {"name": "ค่าสาธารณูปโภค", "color": "#fdfd96", "icon": "Zap"},
    {"name": "สุขภาพ", "color": "#ffb6b9", "icon": "Heart"},
    {"name": "บันเทิง", "color": "#b5d8f7", "icon": "Film"},
    {"name": "งาน", "color": "#e1ccfa", "icon": "Briefcase"},
    {"name": "อื่นๆ", "color": "#84cc16", "icon": "Tag"},
]

async def seed_default_categories(
    db: AsyncSession, user_id: uuid.UUID, locale: str = "en"
) -> list[Category]:
    """Seed default categories for a user if they don't have any."""
    # Check if user already has categories
    stmt = select(func.count()).where(Category.user_id == user_id)
    count = (await db.execute(stmt)).scalar()
    
    if count > 0:
        return []

    templates = DEFAULT_CATEGORIES_TH if locale == "th" else DEFAULT_CATEGORIES_EN
    categories = []
    for cat_data in templates:
        cat = Category(
            user_id=user_id,
            name=cat_data["name"],
            color=cat_data["color"],
            icon=cat_data["icon"]
        )
        db.add(cat)
        categories.append(cat)
        
    await db.commit()
    return categories
