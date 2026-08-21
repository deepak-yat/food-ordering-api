from fastapi import APIRouter,HTTPException,status,Depends
from sqlmodel import Session,select

from app.database import get_db
from app.models.shop import Shop
from app.schemas.customer_view_shop import CustomerShopResponse
from app.models.menu_category import MenuCategory
from app.models.menu_item import MenuItem
from app.schemas.customer_menu import (
    CustomerMenuCategoryResponse,
    CustomerMenuItemResponse
)
router=APIRouter(
    prefix="/customer/view-shop",
    tags=["Customer Interactions"]
)

@router.get("",response_model=list[CustomerShopResponse])
def get_available_shops(
    db:Session = Depends(get_db)
):
    shops=db.exec(
        select(Shop).where(
            Shop.is_active==True,
            Shop.is_approved==True
        )
    ).all()

    return shops

@router.get(
    "/{shop_id}/menu",
    response_model=list[CustomerMenuCategoryResponse]
)
def get_shop_menu(
    shop_id : int ,
    db : Session = Depends(get_db)
):
    shop = db.exec(
        select(Shop).where(
            Shop.shop_id==shop_id,
            Shop.is_active==True,
            Shop.is_approved==True
        )
    ).first()

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )

    categories = db.exec(
        select(MenuCategory).where(
            MenuCategory.shop_id == shop_id
        )
    ).all()
    result=[]
    for category in categories:
        items = db.exec(
            select(MenuItem).where(
                MenuItem.shop_id == shop_id,
                MenuItem.category_id == category.category_id,
                MenuItem.is_available == True
            )
        ).all()

        result.append(
            CustomerMenuCategoryResponse(
                category_id=category.category_id,
                category_name=category.category_name,
                items=[
                    CustomerMenuItemResponse(
                        item_id=item.item_id,
                        category_id=item.category_id,
                        name=item.name,
                        description=item.description,
                        price=item.price,
                        is_available=item.is_available
                    )
                    for item in items
                ]
            )
        )

    return result    
