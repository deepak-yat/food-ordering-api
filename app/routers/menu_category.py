from fastapi import APIRouter,Depends,HTTPException,status
from sqlmodel import Session ,  select 

from app.database import get_db
from app.dependencies import get_current_shop
from app.models.menu_category import MenuCategory
from app.models.shop import Shop
from app.schemas.menu_category import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    UpdateMenuCategory
)

router=APIRouter(
    prefix="/menu/categories",
    tags=["Menu Category"]
)

@router.post("")
def create_category(
    data : MenuCategoryCreate,
    db : Session = Depends(get_db),
    current_shop : Shop = Depends(get_current_shop)
):
    existing_category = db.exec(
        select(MenuCategory).where(
            MenuCategory.shop_id==current_shop.shop_id,
            MenuCategory.category_name==data.category_name
        )
    ).first()

    if existing_category :
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category already exists in the same shop"
        )
    category = MenuCategory(
        shop_id=current_shop.shop_id,
        category_name=data.category_name
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return {
        "message":"Successfully added menu category",
        "category":category
    }

@router.get("",
            response_model=list[MenuCategoryResponse])
def get_category(
    current_shop : Shop = Depends(get_current_shop),
    db: Session=Depends(get_db)
):
    categories = db.exec(
        select(MenuCategory).where(
            MenuCategory.shop_id==current_shop.shop_id
        )
    ).all()
    return categories

@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    data: UpdateMenuCategory,
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    category = db.exec(
        select(MenuCategory).where(
            MenuCategory.category_id == category_id,
            MenuCategory.shop_id == current_shop.shop_id
        )
    ).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    category.category_name = data.category_name.strip()

    db.commit()
    db.refresh(category)

    return {
        "message": "Category updated successfully",
        "category_id": category.category_id,
        "category_name": category.category_name
    }

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    category = db.exec(
        select(MenuCategory).where(
            MenuCategory.category_id == category_id,
            MenuCategory.shop_id == current_shop.shop_id
        )
    ).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully",
        "category_id": category_id
    }