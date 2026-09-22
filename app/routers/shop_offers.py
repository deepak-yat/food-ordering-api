from datetime import datetime, timezone

from fastapi import APIRouter, Depends ,HTTPException,status,File,UploadFile
from sqlmodel import Session, select
from pathlib import Path
from uuid import uuid4
import os

from PIL import Image

from app.database import get_db
from app.dependencies import get_current_shop

from app.models.offer import Offer
from app.models.offer_item import OfferItem
from app.models.menu_item import MenuItem
from app.schemas.offer import OfferResponse, OfferItemResponse,OfferCreate,OfferUpdate


router = APIRouter(
    prefix="/shop/offers",
    tags=["Shop Offers"]
)


def get_offer_status(
    offer: Offer,
    now: datetime | None = None
) -> str:

    if now is None:
        now = datetime.now(timezone.utc)

    if not offer.is_active:
        return "INACTIVE"

    if now < offer.start_at:
        return "SCHEDULED"

    if now >= offer.end_at:
        return "EXPIRED"

    return "LIVE"


@router.get(
    "",
    response_model=list[OfferResponse]
)
def get_shop_offers(
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    offers = db.exec(
        select(Offer)
        .where(
            Offer.shop_id == current_shop.shop_id
        )
        .order_by(Offer.created_at.desc())
    ).all()

    result = []

    now = datetime.now(timezone.utc)

    for offer in offers:

        offer_items = db.exec(
            select(OfferItem, MenuItem)
            .join(
                MenuItem,
                MenuItem.item_id == OfferItem.item_id
            )
            .where(
                OfferItem.offer_id == offer.offer_id
            )
            .order_by(MenuItem.name)
        ).all()

        items = [
            OfferItemResponse(
                item_id=item.item_id,
                item_name=item.name,
                item_price=item.price
            )
            for _, item in offer_items
        ]

        result.append(
            OfferResponse(
                offer_id=offer.offer_id,
                shop_id=offer.shop_id,
                title=offer.title,
                description=offer.description,
                image_url=offer.image_url,
                discount_type=offer.discount_type,
                discount_value=offer.discount_value,
                start_at=offer.start_at,
                end_at=offer.end_at,
                is_active=offer.is_active,
                status=get_offer_status(offer, now),
                items=items,
            )
        )

    return result


@router.post(
    "",
    response_model=OfferResponse,
    status_code=201
)
def create_shop_offer(
    data : OfferCreate,
    db : Session = Depends(get_db),
    current_shop = Depends(get_current_shop)
):
    #validate discount type
    if data.discount_type not in {"PERCENTAGE","FIXED_PRICE"}:
        raise HTTPException(
            status_code=400,
            detail="discount_type must be PERCENTAGE OR FIXED_PRICE"
        )
    # Validate discount value

    if data.discount_type == "PERCENTAGE":
        if not 0 < data.discount_value < 100:
            raise HTTPException(
                status_code=400,
                detail="Percentage discount must be greater than 0 and less than 100"
            )

    else:
        if data.discount_value <= 0:
            raise HTTPException(
                status_code=400,
                detail= "Fixed price must be  greater than 0"
            )

    #Validate date time zone information

    if data.start_at.tzinfo is None or data.start_at.utcoffset() is None:
        raise HTTPException(
            status_code=400,
            detail="start_at must be timezone aware"
        ) 
    if data.end_at.tzinfo is None or data.end_at.utcoffset() is None:
        raise HTTPException(
            status_code=400,
            detail="end_at must be timezone aware"
        )
    
    # Validate time window
    if data.end_at <= data.start_at:
        raise HTTPException(
            status_code=400,
            detail="end_at must be after start_at"
        )

    # Remove duplicate item IDs
    item_ids = list(dict.fromkeys(data.item_ids))

    # Load menu items belonging to the current shop
    menu_items = []

    if item_ids:
        menu_items = db.exec(
            select(MenuItem)
            .where(
                MenuItem.shop_id == current_shop.shop_id,
                MenuItem.item_id.in_(item_ids)
            )
        ).all()

    # Make sure every requested item belongs to this shop
    found_item_ids = {
        item.item_id
        for item in menu_items
    }

    missing_item_ids = set(item_ids) - found_item_ids

    if missing_item_ids:
        raise HTTPException(
            status_code=400,
            detail="One or more menu items do not belong to this shop"
        )

    # Validate fixed price against every attached item's base price
    if data.discount_type == "FIXED_PRICE":

        for item in menu_items:

            if data.discount_value >= item.price:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Fixed price must be strictly below the "
                        f"base price of menu item '{item.name}'"
                    )
                )

    # Create offer
    offer = Offer(
        shop_id=current_shop.shop_id,
        title=data.title,
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        start_at=data.start_at,
        end_at=data.end_at,
        is_active=data.is_active,
    )

    db.add(offer)
    db.flush()

    # Create offer-item relationships
    for item_id in item_ids:
        db.add(
            OfferItem(
                offer_id=offer.offer_id,
                item_id=item_id,
            )
        )

    db.commit()
    db.refresh(offer)

    # Build response
    now = datetime.now(timezone.utc)

    items = [
        OfferItemResponse(
            item_id=item.item_id,
            item_name=item.name,
            item_price=item.price
        )
        for item in sorted(
            menu_items,
            key=lambda item: item.name
        )
    ]

    return OfferResponse(
        offer_id=offer.offer_id,
        shop_id=offer.shop_id,
        title=offer.title,
        description=offer.description,
        image_url=offer.image_url,
        discount_type=offer.discount_type,
        discount_value=offer.discount_value,
        start_at=offer.start_at,
        end_at=offer.end_at,
        is_active=offer.is_active,
        status=get_offer_status(offer, now),
        items=items,
    )

@router.get(
    "/{offer_id}",
    response_model=OfferResponse
)
def get_shop_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    offer = db.exec(
        select(Offer).where(
            Offer.offer_id == offer_id,
            Offer.shop_id == current_shop.shop_id
        )
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    offer_items = db.exec(
        select(OfferItem, MenuItem)
        .join(
            MenuItem,
            MenuItem.item_id == OfferItem.item_id
        )
        .where(
            OfferItem.offer_id == offer.offer_id
        )
        .order_by(MenuItem.name)
    ).all()

    items = [
        OfferItemResponse(
            item_id=item.item_id,
            item_name=item.name,
            item_price=item.price
        )
        for _, item in offer_items
    ]

    now = datetime.now(timezone.utc)

    return OfferResponse(
        offer_id=offer.offer_id,
        shop_id=offer.shop_id,
        title=offer.title,
        description=offer.description,
        image_url=offer.image_url,
        discount_type=offer.discount_type,
        discount_value=offer.discount_value,
        start_at=offer.start_at,
        end_at=offer.end_at,
        is_active=offer.is_active,
        status=get_offer_status(offer, now),
        items=items,
    )


@router.put(
    "/{offer_id}",
    response_model=OfferResponse
)
def update_shop_offer(
    offer_id: int,
    data: OfferUpdate,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    offer = db.exec(
        select(Offer).where(
            Offer.offer_id == offer_id,
            Offer.shop_id == current_shop.shop_id
        )
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    # Use existing values when fields are not provided
    discount_type = (
        data.discount_type
        if data.discount_type is not None
        else offer.discount_type
    )

    discount_value = (
        data.discount_value
        if data.discount_value is not None
        else offer.discount_value
    )

    start_at = (
        data.start_at
        if data.start_at is not None
        else offer.start_at
    )

    end_at = (
        data.end_at
        if data.end_at is not None
        else offer.end_at
    )

    # Validate discount type
    if discount_type not in {"PERCENTAGE", "FIXED_PRICE"}:
        raise HTTPException(
            status_code=400,
            detail="discount_type must be PERCENTAGE or FIXED_PRICE"
        )

    # Validate discount value
    if discount_type == "PERCENTAGE":
        if not 0 < discount_value < 100:
            raise HTTPException(
                status_code=400,
                detail="Percentage discount must be greater than 0 and less than 100"
            )
    else:
        if discount_value <= 0:
            raise HTTPException(
                status_code=400,
                detail="Fixed price must be greater than 0"
            )

    # Validate timezone-aware datetimes
    if start_at.tzinfo is None or start_at.utcoffset() is None:
        raise HTTPException(
            status_code=400,
            detail="start_at must be timezone-aware"
        )

    if end_at.tzinfo is None or end_at.utcoffset() is None:
        raise HTTPException(
            status_code=400,
            detail="end_at must be timezone-aware"
        )

    # Validate time window
    if end_at <= start_at:
        raise HTTPException(
            status_code=400,
            detail="end_at must be after start_at"
        )

    # Resolve item IDs
    if data.item_ids is not None:
        item_ids = list(dict.fromkeys(data.item_ids))
    else:
        existing_items = db.exec(
            select(OfferItem).where(
                OfferItem.offer_id == offer.offer_id
            )
        ).all()

        item_ids = [
            item.item_id
            for item in existing_items
        ]

    # Load menu items belonging to current shop
    menu_items = []

    if item_ids:
        menu_items = db.exec(
            select(MenuItem)
            .where(
                MenuItem.shop_id == current_shop.shop_id,
                MenuItem.item_id.in_(item_ids)
            )
        ).all()

    found_item_ids = {
        item.item_id
        for item in menu_items
    }

    missing_item_ids = set(item_ids) - found_item_ids

    if missing_item_ids:
        raise HTTPException(
            status_code=400,
            detail="One or more menu items do not belong to this shop"
        )

    # Validate fixed price against every attached item's base price
    if discount_type == "FIXED_PRICE":
        for item in menu_items:
            if discount_value >= item.price:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Fixed price must be strictly below the "
                        f"base price of menu item '{item.name}'"
                    )
                )

    # Update offer fields
    if data.title is not None:
        offer.title = data.title

    if data.description is not None:
        offer.description = data.description

    if data.discount_type is not None:
        offer.discount_type = discount_type

    if data.discount_value is not None:
        offer.discount_value = discount_value

    if data.start_at is not None:
        offer.start_at = start_at

    if data.end_at is not None:
        offer.end_at = end_at

    if data.is_active is not None:
        offer.is_active = data.is_active

    # Replace attached items only when item_ids was provided
    if data.item_ids is not None:

        existing_items = db.exec(
            select(OfferItem).where(
                OfferItem.offer_id == offer.offer_id
            )
        ).all()

        for existing_item in existing_items:
            db.delete(existing_item)

        for item_id in item_ids:
            db.add(
                OfferItem(
                    offer_id=offer.offer_id,
                    item_id=item_id,
                )
            )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    now = datetime.now(timezone.utc)

    items = [
        OfferItemResponse(
            item_id=item.item_id,
            item_name=item.name,
            item_price=item.price
        )
        for item in sorted(
            menu_items,
            key=lambda item: item.name
        )
    ]

    return OfferResponse(
        offer_id=offer.offer_id,
        shop_id=offer.shop_id,
        title=offer.title,
        description=offer.description,
        image_url=offer.image_url,
        discount_type=offer.discount_type,
        discount_value=offer.discount_value,
        start_at=offer.start_at,
        end_at=offer.end_at,
        is_active=offer.is_active,
        status=get_offer_status(offer, now),
        items=items,
    )

@router.delete(
    "/{offer_id}",
    status_code=204
)
def delete_shop_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    offer = db.exec(
        select(Offer).where(
            Offer.offer_id == offer_id,
            Offer.shop_id == current_shop.shop_id
        )
    ).first()

    if not offer:
        raise HTTPException(
            status_code=404,
            detail="Offer not found"
        )

    db.delete(offer)
    db.commit()

    return None

@router.post(
    "/{offer_id}/image",
    response_model=OfferResponse
)
async def upload_offer_image(
    offer_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_shop=Depends(get_current_shop),
):
    offer = db.exec(
        select(Offer).where(
            Offer.offer_id == offer_id,
            Offer.shop_id == current_shop.shop_id
        )
    ).first()

    if offer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only jpg, png and webp images are allowed"
        )

    max_size = 5 * 1024 * 1024

    image_bytes = await image.read(max_size + 1)

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

    temp_path = None

    try:
        upload_dir = Path("uploads/offers")

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

        extension = allowed_types[image.content_type]

        filename = f"{uuid4().hex}{extension}"

        final_path = upload_dir / filename

        os.replace(
            temp_path,
            final_path
        )

        temp_path = None

        old_image_url = offer.image_url

        offer.image_url = (
            f"/uploads/offers/{filename}"
        )

        db.add(offer)
        db.commit()
        db.refresh(offer)

        if old_image_url:
            old_filename = Path(
                old_image_url
            ).name

            old_path = upload_dir / old_filename

            if old_path.exists():
                old_path.unlink()

        offer_items = db.exec(
            select(OfferItem, MenuItem)
            .join(
                MenuItem,
                MenuItem.item_id == OfferItem.item_id
            )
            .where(
                OfferItem.offer_id == offer.offer_id
            )
            .order_by(MenuItem.name)
        ).all()

        items = [
            OfferItemResponse(
                item_id=item.item_id,
                item_name=item.name,
                item_price=item.price
            )
            for _, item in offer_items
        ]

        now = datetime.now(timezone.utc)

        return OfferResponse(
            offer_id=offer.offer_id,
            shop_id=offer.shop_id,
            title=offer.title,
            description=offer.description,
            image_url=offer.image_url,
            discount_type=offer.discount_type,
            discount_value=offer.discount_value,
            start_at=offer.start_at,
            end_at=offer.end_at,
            is_active=offer.is_active,
            status=get_offer_status(offer, now),
            items=items,
        )

    except HTTPException:
        raise

    except Exception as error:
        db.rollback()

        if temp_path and temp_path.exists():
            temp_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to upload offer image"
        ) from error