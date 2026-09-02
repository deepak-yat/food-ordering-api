from fastapi import APIRouter,Depends,HTTPException,status
from sqlmodel import Session,select

from app.database import get_db
from app.dependencies import get_current_shop
from app.models.menu_item import MenuItem
from app.models.menu_category import MenuCategory
from app.models.shop import Shop
from app.schemas.menu_item import (
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate
)

router=APIRouter(
    prefix="/menu/categories/item",
    tags=["Menu Category Items"]
)

@router.post(
        "",
        response_model=MenuItemResponse)
def create_menu_item(
    data : MenuItemCreate,
    db : Session = Depends(get_db),
    current_shop : Shop = Depends(get_current_shop),
    
):
    category = db.exec(
        select(MenuCategory).where(
            MenuCategory.category_id==data.category_id,
            MenuCategory.shop_id==current_shop.shop_id
        )
    ).first()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No category with this "
        )

    existing_item = db.exec(
        select(MenuItem).where(
            MenuItem.shop_id == current_shop.shop_id,
            MenuItem.category_id == data.category_id,
            MenuItem.name == data.name
        )
    ).first()

    if existing_item:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item already exists in the menu"
        )

    new_item=MenuItem(
        shop_id=current_shop.shop_id,
        category_id=data.category_id,
        name=data.name,
        price=data.price,
        description=data.description,
        is_available=data.is_available
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.get(
        "",
        response_model=list[MenuItemResponse]
        )
def get_menu_item(
    
    db:Session = Depends(get_db),
    current_shop : Shop = Depends(get_current_shop)
):
    items = db.exec(
        select(
            MenuItem
        ).where(
            MenuItem.shop_id == current_shop.shop_id
        )
    ).all()

    return items

@router.put(
    "/{category_id}/{item_id}",
    response_model=MenuItemResponse
)
def update_menu_item(
    category_id: int,
    item_id: int,
    data: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_shop: Shop = Depends(get_current_shop)
):
    existing_item = db.exec(
        select(MenuItem).where(
            MenuItem.category_id == category_id,
            MenuItem.item_id == item_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if existing_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid category id or item id"
        )

    if data.category_id is not None:

        category = db.exec(
            select(MenuCategory).where(
                MenuCategory.category_id == data.category_id,
                MenuCategory.shop_id == current_shop.shop_id
            )
        ).first()

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found in your shop"
            )

        existing_item.category_id = data.category_id

    if data.name is not None:
        existing_item.name = data.name

    if data.description is not None:
        existing_item.description = data.description

    if data.price is not None:
        existing_item.price = data.price

    if data.is_available is not None:
        existing_item.is_available = data.is_available

    db.commit()
    db.refresh(existing_item)

    return existing_item


@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_shop: Shop = Depends(get_current_shop)
):
    item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == item_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Menu item deleted successfully"
    }