from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_shop

from app.models.menu_item import MenuItem
from app.models.menu_item_option_group import MenuItemOptionGroup
from app.models.menu_item_option import MenuItemOption

from app.schemas.menu_item_option_group import MenuItemOptionGroupResponse,MenuItemOptionGroupCreate,MenuItemOptionGroupUpdate
from app.schemas.menu_item_option import MenuItemOptionResponse,MenuItemOptionCreate,MenuItemOptionUpdate


router = APIRouter(
    prefix="/shop/menu-items",
    tags=["Shop Menu Options"]
)


@router.get(
    "/{item_id}/options",
    response_model=list[MenuItemOptionGroupResponse]
)
def get_menu_item_options(
    item_id: int,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    # 1. Make sure the menu item belongs to the current shop
    menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == item_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not menu_item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )

    # 2. Get all option groups for this menu item
    groups = db.exec(
        select(MenuItemOptionGroup)
        .where(
            MenuItemOptionGroup.menu_item_id == item_id
        )
        .order_by(MenuItemOptionGroup.display_order)
    ).all()

    result = []

    # 3. Load options belonging to each group
    for group in groups:

        options = db.exec(
            select(MenuItemOption)
            .where(
                MenuItemOption.group_id == group.group_id
            )
            .order_by(MenuItemOption.display_order)
        ).all()

        group_response = MenuItemOptionGroupResponse(
            group_id=group.group_id,
            menu_item_id=group.menu_item_id,
            name=group.name,
            selection_type=group.selection_type,
            price_mode=group.price_mode,
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
                    display_order=option.display_order,
                )
                for option in options
            ],
        )

        result.append(group_response)

    return result

@router.post(
    "/{item_id}/option-groups",
    response_model=MenuItemOptionGroupResponse,
    status_code=201
)
def create_option_group(
    item_id: int,
    data: MenuItemOptionGroupCreate,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    # Make sure the menu item belongs to the current shop
    menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == item_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not menu_item:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )

    # Validate selection type
    if data.selection_type not in {"SINGLE", "MULTIPLE"}:
        raise HTTPException(
            status_code=400,
            detail="selection_type must be SINGLE or MULTIPLE"
        )

    # Validate selection limits
    if data.min_selection < 0:
        raise HTTPException(
            status_code=400,
            detail="min_selection cannot be negative"
        )

    if data.max_selection is not None and data.max_selection < 0:
        raise HTTPException(
            status_code=400,
            detail="max_selection cannot be negative"
        )

    if (
        data.max_selection is not None
        and data.min_selection > data.max_selection
    ):
        raise HTTPException(
            status_code=400,
            detail="min_selection cannot be greater than max_selection"
        )

    # SINGLE should never allow more than one selection
    if data.selection_type == "SINGLE":
        if data.max_selection is None:
            data.max_selection = 1

        if data.max_selection > 1:
            raise HTTPException(
                status_code=400,
                detail="SINGLE selection type cannot have max_selection greater than 1"
            )

        if data.min_selection > 1:
            raise HTTPException(
                status_code=400,
                detail="SINGLE selection type cannot have min_selection greater than 1"
            )

    group = MenuItemOptionGroup(
        menu_item_id=item_id,
        name=data.name.strip(),
        selection_type=data.selection_type,
        price_mode=data.price_mode,
        required=data.required,
        min_selection=data.min_selection,
        max_selection=data.max_selection,
        display_order=data.display_order,
        is_active=True,
    )

    db.add(group)
    db.commit()
    db.refresh(group)

    return MenuItemOptionGroupResponse(
        group_id=group.group_id,
        menu_item_id=group.menu_item_id,
        name=group.name,
        selection_type=group.selection_type,
        price_mode=group.price_mode,
        required=group.required,
        min_selection=group.min_selection,
        max_selection=group.max_selection,
        display_order=group.display_order,
        is_active=group.is_active,
        options=[],
    )


@router.post(
    "/option-groups/{group_id}/options",
    response_model=MenuItemOptionResponse,
    status_code=201
)
def create_option(
    group_id: int,
    data: MenuItemOptionCreate,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    # Find the option group
    group = db.exec(
        select(MenuItemOptionGroup)
        .join(
            MenuItem,
            MenuItem.item_id == MenuItemOptionGroup.menu_item_id
        )
        .where(
            MenuItemOptionGroup.group_id == group_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Option group not found"
        )

    # Validate name
    option_name = data.name.strip()

    if not option_name:
        raise HTTPException(
            status_code=400,
            detail="Option name cannot be empty"
        )

    # Validate price
    if data.price < 0:
        raise HTTPException(
            status_code=400,
            detail="Option price cannot be negative"
        )

    # Create option
    option = MenuItemOption(
        group_id=group_id,
        name=option_name,
        price=data.price,
        is_available=data.is_available,
        display_order=data.display_order,
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return MenuItemOptionResponse(
        option_id=option.option_id,
        group_id=option.group_id,
        name=option.name,
        price=option.price,
        is_available=option.is_available,
        display_order=option.display_order,
    )


@router.put(
    "/option-groups/{group_id}/options/{option_id}",
    response_model=MenuItemOptionResponse
)
def update_option(
    group_id: int,
    option_id: int,
    data: MenuItemOptionUpdate,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    group = db.exec(
        select(MenuItemOptionGroup)
        .join(
            MenuItem,
            MenuItem.item_id == MenuItemOptionGroup.menu_item_id
        )
        .where(
            MenuItemOptionGroup.group_id == group_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Option group not found"
        )

    option = db.exec(
        select(MenuItemOption).where(
            MenuItemOption.option_id == option_id,
            MenuItemOption.group_id == group_id
        )
    ).first()

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Option not found"
        )

    if data.name is not None:
        name = data.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Option name cannot be empty"
            )

        option.name = name

    if data.price is not None:
        if data.price < 0:
            raise HTTPException(
                status_code=400,
                detail="Option price cannot be negative"
            )

        option.price = data.price

    if data.is_available is not None:
        option.is_available = data.is_available


    if data.display_order is not None:
        option.display_order = data.display_order

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.delete(
    "/option-groups/{group_id}/options/{option_id}",
    response_model=MenuItemOptionResponse
)
def deactivate_option(
    group_id: int,
    option_id: int,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    group = db.exec(
        select(MenuItemOptionGroup)
        .join(
            MenuItem,
            MenuItem.item_id == MenuItemOptionGroup.menu_item_id
        )
        .where(
            MenuItemOptionGroup.group_id == group_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Option group not found"
        )

    option = db.exec(
        select(MenuItemOption).where(
            MenuItemOption.option_id == option_id,
            MenuItemOption.group_id == group_id
        )
    ).first()

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Option not found"
        )

    option.is_available = False

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.put(
    "/option-groups/{group_id}",
    response_model=MenuItemOptionGroupResponse
)
def update_option_group(
    group_id: int,
    data: MenuItemOptionGroupUpdate,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    group = db.exec(
        select(MenuItemOptionGroup)
        .join(
            MenuItem,
            MenuItem.item_id == MenuItemOptionGroup.menu_item_id
        )
        .where(
            MenuItemOptionGroup.group_id == group_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Option group not found"
        )

    if data.name is not None:
        name = data.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Group name cannot be empty"
            )

        group.name = name

    selection_type = (
        data.selection_type
        if data.selection_type is not None
        else group.selection_type
    )

    if selection_type not in {"SINGLE", "MULTIPLE"}:
        raise HTTPException(
            status_code=400,
            detail="selection_type must be SINGLE or MULTIPLE"
        )

    min_selection = (
        data.min_selection
        if data.min_selection is not None
        else group.min_selection
    )

    max_selection = (
        data.max_selection
        if data.max_selection is not None
        else group.max_selection
    )

    if min_selection < 0:
        raise HTTPException(
            status_code=400,
            detail="min_selection cannot be negative"
        )

    if max_selection is not None and max_selection < 0:
        raise HTTPException(
            status_code=400,
            detail="max_selection cannot be negative"
        )

    if max_selection is not None and min_selection > max_selection:
        raise HTTPException(
            status_code=400,
            detail="min_selection cannot be greater than max_selection"
        )

    if selection_type == "SINGLE":
        if max_selection is None:
            max_selection = 1

        if min_selection > 1 or max_selection > 1:
            raise HTTPException(
                status_code=400,
                detail="SINGLE selection type cannot have more than one selection"
            )

    group.selection_type = selection_type
    group.min_selection = min_selection
    group.max_selection = max_selection

    if data.required is not None:
        group.required = data.required

    if data.display_order is not None:
        group.display_order = data.display_order

    if data.is_active is not None:
        group.is_active = data.is_active
    if data.price_mode is not None:
        if data.price_mode not in {"ADD", "REPLACE"}:
            raise HTTPException(
            status_code=400,
            detail="price_mode must be ADD or REPLACE"
        )

        group.price_mode = data.price_mode

    db.add(group)
    db.commit()
    db.refresh(group)

    options = db.exec(
        select(MenuItemOption)
        .where(MenuItemOption.group_id == group.group_id)
        .order_by(MenuItemOption.display_order)
    ).all()

    return MenuItemOptionGroupResponse(
        group_id=group.group_id,
        menu_item_id=group.menu_item_id,
        name=group.name,
        selection_type=group.selection_type,
        price_mode=group.price_mode,
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
                display_order=option.display_order,
            )
            for option in options
        ],
    )

@router.delete(
    "/option-groups/{group_id}",
    response_model=MenuItemOptionGroupResponse
)
def deactivate_option_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    group = db.exec(
        select(MenuItemOptionGroup)
        .join(
            MenuItem,
            MenuItem.item_id == MenuItemOptionGroup.menu_item_id
        )
        .where(
            MenuItemOptionGroup.group_id == group_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Option group not found"
        )

    group.is_active = False

    options = db.exec(
        select(MenuItemOption)
        .where(MenuItemOption.group_id == group_id)
    ).all()

    for option in options:
        option.is_available = False
        db.add(option)

    db.add(group)
    db.commit()
    db.refresh(group)

    options = db.exec(
        select(MenuItemOption)
        .where(MenuItemOption.group_id == group_id)
        .order_by(MenuItemOption.display_order)
    ).all()

    return MenuItemOptionGroupResponse(
        group_id=group.group_id,
        menu_item_id=group.menu_item_id,
        name=group.name,
        selection_type=group.selection_type,
        price_mode=group.price_mode,
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
                display_order=option.display_order,
            )
            for option in options
        ],
    )