from fastapi import APIRouter, Depends, HTTPException,status
from sqlmodel import Session
from app.dependencies import get_current_shop
from app.models.shop import Shop
from app.database import get_db
from app.schemas.shop import (
    ShopProfileResponse,
    ShopProfileUpdate
)
from app.services.geocoding import geo_code_address

router = APIRouter(
    prefix="/shop",
    tags=["Shop"]
)


@router.get("/my-shop")
def get_my_shop(
    current_shop: Shop = Depends(get_current_shop)
):
    return current_shop


@router.get("/my-profile",
            response_model=ShopProfileResponse)
def get_shop_profile(
    current_shop : Shop = Depends(get_current_shop)
):
    return ShopProfileResponse(
        shop_id=current_shop.shop_id,
        shop_name=current_shop.shop_name,
        description=current_shop.description,
        phone=current_shop.phone,
        address_line1=current_shop.address_line1,
        address_line2=current_shop.address_line2,
        city=current_shop.city,
        state=current_shop.state,
        pincode=current_shop.pincode,
        is_active=current_shop.is_active,
        is_approved=current_shop.is_approved,
    )

@router.put("/my-profile",
            response_model=ShopProfileResponse)
def update_shop_profile(
    data : ShopProfileUpdate ,
    current_shop : Shop = Depends(get_current_shop),
    db : Session = Depends(get_db)
):
    full_address = ", ".join(
        part
        for part in [
            data.address_line1,
            data.address_line2,
            data.city,
            data.state,
            data.pincode
        ]
        if part
    )
    try:
        latitude, longitude = geo_code_address(full_address)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to find provided address"
        )

    current_shop.shop_name=data.shop_name
    current_shop.description=data.description
    current_shop.phone=data.phone
    current_shop.address_line1=data.address_line1
    current_shop.address_line2=data.address_line2
    current_shop.city=data.city
    current_shop.state=data.state
    current_shop.pincode=data.pincode
    current_shop.latitude=latitude
    current_shop.longitude=longitude

    db.add(current_shop)
    db.commit()
    db.refresh(current_shop)

    return ShopProfileResponse(
        shop_id=current_shop.shop_id,
        shop_name=current_shop.shop_name,
        description=current_shop.description,
        phone=current_shop.phone,
        address_line1=current_shop.address_line1,
        address_line2=current_shop.address_line2,
        city=current_shop.city,
        state=current_shop.state,
        is_approved=current_shop.is_approved,
        is_active=current_shop.is_active
    )

@router.put("/my-shop/status")
def change_status(
    db : Session = Depends(get_db),
    current_shop : Shop = Depends(get_current_shop)
):
    current_shop.is_active= not current_shop.is_active

    db.commit()
    db.refresh(current_shop)

    return {
        "message":"Changed status of the shop",
        "is_active": current_shop.is_active
    }

