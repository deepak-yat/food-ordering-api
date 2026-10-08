from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from app.database import get_db
from app.dependencies import get_current_delivery_partner
from app.models.delivery_partner import (
    DeliveryPartner,
    DeliveryPartnerStatus
)
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_delivery_partner
from app.models.delivery import Delivery, DeliveryStatus
from app.models.delivery_partner import DeliveryPartner
from app.schemas.delivery_partner import DeliveryPartnerLocationUpdate
from app.models.order import Order
from app.services.delivery_assignment import offer_next_candidate
router = APIRouter(
    prefix="/delivery",
    tags=["Delivery Partner"]
)

@router.put("/online")
def go_online(
    current_partner: DeliveryPartner = Depends(
        get_current_delivery_partner
    ),
    db: Session = Depends(get_db)
):
    if current_partner.status != DeliveryPartnerStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active delivery partners can go online"
        )

    if current_partner.is_online:
        return {
            "message": "Delivery partner is already online",
            "is_online": True
        }

    current_partner.is_online = True

    db.add(current_partner)
    db.commit()
    db.refresh(current_partner)

    return {
        "message": "Delivery partner is now online",
        "is_online": current_partner.is_online
    }

@router.put("/offline")
def go_offline(
    current_partner: DeliveryPartner = Depends(
        get_current_delivery_partner
    ),
    db: Session = Depends(get_db)
):
    if not current_partner.is_online:
        return {
            "message": "Delivery partner is already offline",
            "is_online": False
        }

    current_partner.is_online = False

    db.add(current_partner)
    db.commit()
    db.refresh(current_partner)

    return {
        "message": "Delivery partner is now offline",
        "is_online": current_partner.is_online
    }

@router.put("/location")
def update_location(
    location_data: DeliveryPartnerLocationUpdate,
    current_partner: DeliveryPartner = Depends(
        get_current_delivery_partner
    ),
    db: Session = Depends(get_db)
):
    current_partner.latitude = location_data.latitude
    current_partner.longitude = location_data.longitude

    db.add(current_partner)
    db.commit()
    db.refresh(current_partner)

    return {
        "message": "Location updated successfully",
        "latitude": current_partner.latitude,
        "longitude": current_partner.longitude
    }

@router.get("/offers")
def get_delivery_offers(
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    delivery = db.exec(
        select(Delivery).where(
            Delivery.delivery_partner_id == current_partner.partner_id,
            Delivery.status == DeliveryStatus.OFFERED
        )
    ).first()

    if delivery is None:
        return []

    now = datetime.now(timezone.utc)

    # Offer expired
    if (
        delivery.offer_expires_at is not None
        and delivery.offer_expires_at <= now
    ):
        order = db.get(Order, delivery.order_id)

        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        delivery.status = DeliveryStatus.PENDING_OFFER
        db.add(delivery)

        if order is not None:
            offer_next_candidate(
                order,
                delivery,
                db
            )

        db.commit()

        # This partner's offer has expired, so they should
        # no longer receive it in this response.
        return []

    return [delivery]

@router.put("/offers/{delivery_id}/accept")
def accept_delivery_offer(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    delivery = db.exec(
        select(Delivery).where(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_partner_id == current_partner.partner_id
        )
    ).first()

    if delivery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery offer not found"
        )

    if delivery.status != DeliveryStatus.OFFERED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery offer is no longer available"
        )

    if (
        delivery.offer_expires_at is not None
        and delivery.offer_expires_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery offer has expired"
        )

    delivery.status = DeliveryStatus.ASSIGNED
    delivery.assigned_at = datetime.now(timezone.utc)

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Delivery accepted successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status,
        "assigned_at": delivery.assigned_at,
    }

@router.put("/offers/{delivery_id}/decline")
def decline_delivery_offer(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db)
):
    delivery = db.exec(
        select(Delivery).where(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_partner_id == current_partner.partner_id
        )
    ).first()

    if delivery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery offer not found"
        )

    if delivery.status != DeliveryStatus.OFFERED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delivery offer is no longer available"
        )

    offered_ids = delivery.offered_to_partner_ids or []

    if current_partner.partner_id not in offered_ids:
        offered_ids.append(current_partner.partner_id)

    delivery.offered_to_partner_ids = offered_ids

    # Temporarily return the delivery to pending state.
    # The next-candidate rotation will be added next.
    delivery.delivery_partner_id = None
    delivery.offer_expires_at = None
    delivery.status = DeliveryStatus.PENDING_OFFER

    db.add(delivery)

    order = db.get(Order, delivery.order_id)

    if order is not None:
        offer_next_candidate(
            order,
            delivery,
            db
        )

    db.commit()
    db.refresh(delivery)

    return {
        "message": "Delivery offer declined",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status,
    }