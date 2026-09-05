from fastapi import APIRouter,Depends,Query
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_customer

from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.models.shop import Shop

from app.schemas.search import (
    SearchResponse,
    ShopSearchResult,
    MenuItemSearchResult,
)

router=APIRouter(
    prefix="/customer",
    tags=["customer search"]
)

@router.get(
    "/search",
    response_model=SearchResponse
)
def search_customer(
    q:str = Query(
        min_length=1,
        max_length=100
    ),
    
    db: Session = Depends(get_db)
):
    search_term=q.strip()
    if not search_term:
        return SearchResponse(
            shops=[],
            items=[]
        )

    pattern = f"%{search_term}%"

    shops = db.exec(
        select(Shop).where(
            Shop.is_approved==True,
            Shop.is_approved==True,
            Shop.shop_name.ilike(pattern)
        )
        .limit(3)
    ).all()

    shop_results = [
        ShopSearchResult(
            shop_id=shop.shop_id,
            shop_name=shop.shop_name
        )
        for shop in shops
    ]

    items = db.exec(
        select(MenuItem, Shop).join(
            Shop,
            Shop.shop_id==MenuItem.shop_id
        ).where(
            Shop.is_approved == True,
            Shop.is_active == True,
            MenuItem.is_available == True,
            MenuItem.name.ilike(pattern)
        )
        .limit(5)
    ).all()

    item_results = [
        MenuItemSearchResult(
            item_id=item.item_id,
            item_name=item.name,
            shop_id=shop.shop_id,
            shop_name=shop.shop_name
        )
        for item, shop in items
    ]

    return SearchResponse(
        shops=shop_results,
        items=item_results
    )