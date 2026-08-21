from fastapi import APIRouter,Depends,HTTPException,status
from sqlmodel import Session ,  select 

from app.database import get_db
from app.dependencies import get_current_shop
from app.models.menu_category import MenuCategory
from app.models.shop import Shop
from app.schemas.menu_category import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuCategoryUpdate
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