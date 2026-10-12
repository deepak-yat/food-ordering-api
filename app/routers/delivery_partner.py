from datetime import datetime, timezone

from sqlmodel import Session, select

from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order
from app.models.shop import Shop
from app.models.customer import Customer
from app.models.order_delivery_address import OrderDeliveryAddress
from fastapi import APIRouter, Depends
from app.dependencies import get_current_delivery_partner
from app.models.delivery_partner import DeliveryPartner, DeliveryPartnerStatus
from fastapi import HTTPException
from app.database import get_db
from sqlmodel import Session
from app.schemas.delivery_partner import (
    DeliveryPartnerProfileUpdate,
    DeliveryPartnerAvailabilityUpdate,
    DeliveryPartnerLocationUpdate
)
from app.services.delivery_assignment import offer_delivery_to_next_partner
router = APIRouter(
    prefix="/delivery-partner",
    tags=["Delivery Partner"],
)


@router.get("/profile")
def get_delivery_partner_profile(
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
):
    return {
        "partner_id": partner.partner_id,
        "user_id": partner.user_id,
        "full_name": partner.full_name,
        "phone_number": partner.phone_number,
        "address": partner.address,
        "vehicle_type": partner.vehicle_type,
        "vehicle_number": partner.vehicle_number,
        "status": partner.status.value,
        "is_online": partner.is_online,
        "latitude": partner.latitude,
        "longitude": partner.longitude,
    }

@router.patch("/profile")
def update_delivery_partner_profile(
    data: DeliveryPartnerProfileUpdate,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update",
        )

    for field, value in updates.items():
        if value is not None:
            value = value.strip()
            if not value:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be blank",
                )
        setattr(partner, field, value)

    db.add(partner)
    db.commit()
    db.refresh(partner)

    return {
        "message": "Profile updated successfully",
        "partner_id": partner.partner_id,
        "full_name": partner.full_name,
        "phone_number": partner.phone_number,
        "address": partner.address,
        "vehicle_type": partner.vehicle_type,
        "vehicle_number": partner.vehicle_number,
    }

@router.patch("/availability")
def update_delivery_partner_availability(
    data: DeliveryPartnerAvailabilityUpdate,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    partner.is_online = data.is_online

    db.add(partner)
    db.commit()
    db.refresh(partner)

    return {
        "message": (
            "You are now online"
            if partner.is_online
            else "You are now offline"
        ),
        "partner_id": partner.partner_id,
        "is_online": partner.is_online,
    }

@router.patch("/location")
def update_delivery_partner_location(
    data: DeliveryPartnerLocationUpdate,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    partner.latitude = data.latitude
    partner.longitude = data.longitude

    db.add(partner)
    db.commit()
    db.refresh(partner)

    return {
        "message": "Location updated successfully",
        "partner_id": partner.partner_id,
        "latitude": partner.latitude,
        "longitude": partner.longitude,
    }

@router.get("/offers")
def get_delivery_partner_offers(
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Find all offers that have expired.
    expired_deliveries = db.exec(
        select(Delivery).where(
            Delivery.status == DeliveryStatus.OFFERED,
            Delivery.offer_expires_at <= now,
        )
    ).all()

    # Release expired offers and prepare them for reassignment.
    for delivery in expired_deliveries:
        previous_partner_id = delivery.delivery_partner_id

        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        delivery.status = DeliveryStatus.PENDING_OFFER

        # Ensure the previous partner isn't offered the same delivery again.
        offered_to = list(delivery.offered_to_partner_ids or [])

        if (
            previous_partner_id is not None
            and previous_partner_id not in offered_to
        ):
            offered_to.append(previous_partner_id)

        delivery.offered_to_partner_ids = offered_to
        db.add(delivery)

    # Save the released offers before passing them to the assignment service.
    if expired_deliveries:
        db.commit()

    # Try to assign each expired delivery to the next eligible partner.
    for delivery in expired_deliveries:
        db.refresh(delivery)

        try:
            offer_delivery_to_next_partner(db, delivery)
        except ValueError as exc:
            print(
                f"Could not reassign delivery {delivery.delivery_id}: {exc}"
            )

    # Fetch offers currently assigned to the authenticated partner.
    deliveries = db.exec(
        select(Delivery).where(
            Delivery.delivery_partner_id == partner.partner_id,
            Delivery.status == DeliveryStatus.OFFERED,
        )
    ).all()

    offers = []

    for delivery in deliveries:
        expires_at = delivery.offer_expires_at

        if expires_at is None or expires_at <= datetime.now(timezone.utc):
            continue

        order = db.get(Order, delivery.order_id)

        if order is None:
            continue

        shop = db.get(Shop, order.shop_id)

        if shop is None:
            continue

        address = db.exec(
            select(OrderDeliveryAddress).where(
                OrderDeliveryAddress.order_id == order.order_id
            )
        ).first()

        customer = db.get(Customer, order.customer_id)

        offers.append(
            {
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "delivery_status": delivery.status.value,
                "offer_expires_at": expires_at,
                "distance_km": delivery.distance_km,
                "customer_fee": delivery.customer_fee,
                "shop": {
                    "shop_id": shop.shop_id,
                    "shop_name": shop.shop_name,
                    "latitude": shop.latitude,
                    "longitude": shop.longitude,
                },
                "customer": {
                    "customer_id": customer.customer_id,
                    "name": customer.customer_name,
                    "phone": customer.phone,
                } if customer else None,
                "delivery_address": {
                    "address_line1": address.address_line1,
                    "address_line2": address.address_line2,
                    "city": address.city,
                    "state": address.state,
                    "pincode": address.pincode,
                } if address else None,
            }
        )

    return {
        "partner_id": partner.partner_id,
        "offers_count": len(offers),
        "offers": offers,
    }


@router.post("/offers/{delivery_id}/accept")
def accept_delivery_offer(
    delivery_id: int,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    delivery = db.exec(
        select(Delivery)
        .where(Delivery.delivery_id == delivery_id)
        .with_for_update()
    ).first()
    if delivery is None:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    # Ensure this offer belongs to the authenticated partner.
    if delivery.delivery_partner_id != partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery offer is not assigned to you",
        )

    if delivery.status != DeliveryStatus.OFFERED:
        raise HTTPException(
            status_code=409,
            detail="This delivery is no longer available for acceptance",
        )

    if (
        delivery.offer_expires_at is None
        or delivery.offer_expires_at <= now
    ):
        raise HTTPException(
            status_code=409,
            detail="This delivery offer has expired",
        )

    if not partner.is_online:
        raise HTTPException(
            status_code=409,
            detail="You must be online to accept a delivery offer",
        )

    if partner.status != DeliveryPartnerStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail="Your delivery partner account is not approved",
        )

    # Ensure the associated order still exists and is READY.
    order = db.get(Order, delivery.order_id)

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Associated order not found",
        )

    from app.models.order import OrderStatus

    if order.status != OrderStatus.READY:
        raise HTTPException(
            status_code=409,
            detail="The order is no longer ready for delivery",
        )

    delivery.status = DeliveryStatus.ASSIGNED
    delivery.assigned_at = now

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Delivery offer accepted successfully",
        "delivery_id": delivery.delivery_id,
        "order_id": delivery.order_id,
        "status": delivery.status.value,
        "assigned_at": delivery.assigned_at,
    }


@router.post("/offers/{delivery_id}/decline")
def decline_delivery_offer(
    delivery_id: int,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if delivery is None:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    if delivery.delivery_partner_id != partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery offer is not assigned to you",
        )

    if delivery.status != DeliveryStatus.OFFERED:
        raise HTTPException(
            status_code=409,
            detail="This delivery is no longer available to decline",
        )

    # Remember the current partner so they won't receive this offer again.
    offered_to = list(delivery.offered_to_partner_ids or [])

    if partner.partner_id not in offered_to:
        offered_to.append(partner.partner_id)

    delivery.offered_to_partner_ids = offered_to

    # Release the current offer.
    delivery.delivery_partner_id = None
    delivery.offer_expires_at = None
    delivery.status = DeliveryStatus.PENDING_OFFER

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    # Attempt to offer the delivery to the next eligible partner.
    try:
        delivery = offer_delivery_to_next_partner(db, delivery)
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    return {
        "message": "Delivery offer declined successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "next_partner_assigned": (
            delivery.delivery_partner_id is not None
            and delivery.status == DeliveryStatus.OFFERED
        ),
    }

