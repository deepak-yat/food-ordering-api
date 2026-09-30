from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
) 
from pathlib import Path
from uuid import uuid4
import os

from PIL import Image
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
        is_available=data.is_available,
        has_options=data.has_options,
        allow_parent_purchase=data.allow_parent_purchase
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



@router.post(
        "/{item_id}/image",
        response_model=MenuItemResponse
)
async def upload_menu_item_image(
    item_id : int,
    image : UploadFile = File(...),
    db : Session = Depends(get_db),
    current_shop : Shop = Depends(get_current_shop)
):
    item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == item_id,
            MenuItem.shop_id == current_shop.shop_id
        )
    ).first()

    #------------------
    # validate contend
    #------------------
    allowed_types = {
        "image/jpeg":".jpg",
        "image/png":".png",
        "image/webp":".webp"
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only jpg ,png and webp images are allowed"
        )

    max_size = 5 * 1024 *1024
    image_bytes = await image.read(max_size+1)

    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image must be smaller than 5 mb"
        )
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is empty"
        )
    # -------------------------------------------------
    # 4. Verify that the file is actually an image
    # -------------------------------------------------
    temp_path = None

    try:
        upload_dir = Path("uploads/menu-items")
        upload_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        temp_name = f"temp-{uuid4().hex}"
        temp_path = upload_dir / temp_name

        with open(temp_path, "wb") as file:
            file.write(image_bytes)

        try:
            with Image.open(temp_path) as img:
                img.verify()

        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image file"
            )

        # -------------------------------------------------
        # 5. Generate our own filename
        # -------------------------------------------------
        extension = allowed_types[image.content_type]

        filename = f"{uuid4().hex}{extension}"

        final_path = upload_dir / filename

        os.replace(
            temp_path,
            final_path
        )

        temp_path = None

        # -------------------------------------------------
        # 6. Save the public URL in the database
        # -------------------------------------------------
        old_image_url = item.image_url
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found"
                )
        item.image_url = (
            f"/uploads/menu-items/{filename}"
        )

        db.add(item)
        db.commit()
        db.refresh(item)

        # -------------------------------------------------
        # 7. Remove the old image only after DB success
        # -------------------------------------------------
        if old_image_url:
            old_filename = Path(
                old_image_url
            ).name

            old_path = upload_dir / old_filename

            if old_path.exists():
                old_path.unlink()

        return item

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        # Remove newly created file if DB operation failed
        if temp_path and temp_path.exists():
            temp_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload menu item image"
        ) from error

    


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
    if data.has_options is not None:
        existing_item.has_options = data.has_options

    if data.allow_parent_purchase is not None:
        existing_item.allow_parent_purchase = data.allow_parent_purchase

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