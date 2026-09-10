from fastapi import APIRouter, Depends, HTTPException,status
from sqlmodel import Session, select
from app.dependencies import get_current_shop
from app.models.shop import Shop
from app.database import get_db
from app.schemas.shop import (
    ShopProfileResponse,
    ShopProfileUpdate
)
from app.models.message_recipient import MessageRecipient
from app.services.geocoding import geo_code_address
from app.models.message import Message
router = APIRouter(
    prefix="/shop",
    tags=["Shop"]
)
from datetime import datetime, timezone


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

@router.get("/messages")
def get_shop_messages(
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    message_records = db.exec(
        select(MessageRecipient, Message)
        .join(
            Message,
            Message.message_id == MessageRecipient.message_id
        )
        .where(
            MessageRecipient.shop_id == current_shop.shop_id
        )
        .order_by(
            Message.created_at.desc()
        )
    ).all()

    messages = []

    for recipient, message in message_records:
        messages.append({
            "recipient_id": recipient.recipient_id,
            "message_id": message.message_id,
            "subject": message.subject,
            "content": message.content,
            "is_read": recipient.is_read,
            "read_at": recipient.read_at,
            "created_at": message.created_at
        })

    return {
        "messages": messages
    }

@router.put("messages/{recipient_id}/read")
def mark_message_as_read(
    recipient_id : int ,
    current_shop : Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    recipient= db.get(
        MessageRecipient,
        recipient_id
    )
    if recipient is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    if recipient.shop_id != current_shop.shop_id:
        raise HTTPException (
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this message.."
        ) 

    recipient.is_read = True
    recipient.read_at = datetime.now(timezone.utc)

    db.add(recipient)
    db.commit()
    db.refresh(recipient)

    return {
        "message": "Message marked as read",
        "recipient_id": recipient.recipient_id,
        "is_read": recipient.is_read,
        "read_at": recipient.read_at
    }