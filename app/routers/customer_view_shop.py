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

from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.menu_item_option import MenuItemOption

from app.schemas.menu_item_option_group import MenuItemOptionGroupResponse
from app.schemas.menu_item_option import MenuItemOptionResponse


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
    shop_id: int,
    db: Session = Depends(get_db)
):
    shop = db.exec(
        select(Shop).where(
            Shop.shop_id == shop_id,
            Shop.is_active == True,
            Shop.is_approved == True
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

    result = []

    for category in categories:

        items = db.exec(
            select(MenuItem).where(
                MenuItem.shop_id == shop_id,
                MenuItem.category_id == category.category_id,
                MenuItem.is_available == True
            )
        ).all()

        customer_items = []

        for item in items:

            option_groups = []

            # Only load option groups when the item supports options
            if item.has_options:

                groups = db.exec(
                    select(MenuItemOptionGroup)
                    .where(
                        MenuItemOptionGroup.menu_item_id == item.item_id,
                        MenuItemOptionGroup.is_active == True
                    )
                    .order_by(
                        MenuItemOptionGroup.display_order
                    )
                ).all()

                for group in groups:

                    options = db.exec(
                        select(MenuItemOption)
                        .where(
                            MenuItemOption.group_id == group.group_id,
                            MenuItemOption.is_available == True
                        )
                        .order_by(
                            MenuItemOption.display_order
                        )
                    ).all()

                    option_groups.append(
                        MenuItemOptionGroupResponse(
                            group_id=group.group_id,
                            menu_item_id=group.menu_item_id,
                            name=group.name,
                            selection_type=group.selection_type,
                            price_mode = group.price_mode,
                            required=group.required,
                            min_selection=group.min_selection,
                            max_selection=group.max_selection,
                            display_order=group.display_order,
                            is_active=group.is_active,
                            options=[
                                MenuItemOptionResponse(
                                    option_id=option.option_id,
                                    group_id=option.group_id,
                                    name=option.name,
                                    price=option.price,
                                    is_available=option.is_available,
                                    display_order=option.display_order
                                )
                                for option in options
                            ]
                        )
                    )

            customer_items.append(
                CustomerMenuItemResponse(
                    item_id=item.item_id,
                    category_id=item.category_id,
                    name=item.name,
                    description=item.description,
                    price=item.price,
                    is_available=item.is_available,
                    image_url=item.image_url,
                    has_options=item.has_options,
                    allow_parent_purchase=item.allow_parent_purchase,
                    option_groups=option_groups
                )
            )

        result.append(
            CustomerMenuCategoryResponse(
                category_id=category.category_id,
                category_name=category.category_name,
                items=customer_items
            )
        )

    return result  
