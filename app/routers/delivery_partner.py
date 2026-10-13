from datetime import datetime, timezone
import requests
import secrets
from datetime import timedelta
from sqlmodel import Session, select
from fastapi import HTTPException
from pydantic import BaseModel  
from app.models.delivery import Delivery, DeliveryStatus
from app.models.notification import Notification, NotificationType
from app.models.order import Order, OrderStatus
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
from app.services.geocoding import reverse_geocode
from app.services.delivery_assignment import offer_delivery_to_next_partner
router = APIRouter(
    prefix="/delivery-partner",
    tags=["Delivery Partner"],
)

class ReverseGeocodeRequest(BaseModel):
    latitude: float
    longitude: float
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
    partner.location_updated_at = datetime.now(timezone.utc)
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

@router.post("/reverse-geocode")
def reverse_geocode_delivery_partner_location(
    payload: ReverseGeocodeRequest,
):
    try:
        return reverse_geocode(
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve the location address from GraphHopper.",
        ) from exc

@router.get("/active")
def get_active_delivery(
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    active_statuses = [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.ARRIVED_AT_SHOP,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.OUT_FOR_DELIVERY,
        DeliveryStatus.ARRIVED_AT_CUSTOMER,
    ]

    delivery = db.exec(
        select(Delivery).where(
            Delivery.delivery_partner_id == partner.partner_id,
            Delivery.status.in_(active_statuses),
        )
    ).first()

    if delivery is None:
        return {"delivery": None}

    order = db.get(Order, delivery.order_id)

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Associated order not found",
        )

    shop = db.get(Shop, order.shop_id)

    address = db.exec(
        select(OrderDeliveryAddress).where(
            OrderDeliveryAddress.order_id == order.order_id
        )
    ).first()

    customer = db.get(Customer, order.customer_id)

    return {
        "delivery": {
            "delivery_id": delivery.delivery_id,
            "order_id": delivery.order_id,
            "status": delivery.status.value,
            "distance_km": delivery.distance_km,
            "customer_fee": delivery.customer_fee,
            "partner_earning": delivery.partner_earning,
            "assigned_at": delivery.assigned_at,
            "arrived_at_shop_at": delivery.arrived_at_shop_at,
            "picked_up_at": delivery.picked_up_at,
            "out_for_delivery_at": delivery.out_for_delivery_at,
            "arrived_at_customer_at": delivery.arrived_at_customer_at,
            "shop": {
                "shop_id": shop.shop_id,
                "shop_name": shop.shop_name,
            } if shop else None,
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
    }

@router.post("/deliveries/{delivery_id}/arrived-at-shop")
def mark_arrived_at_shop(
    delivery_id: int,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    # Find the delivery.
    delivery = db.get(Delivery, delivery_id)

    if delivery is None:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    # Ensure this delivery belongs to the authenticated partner.
    if delivery.delivery_partner_id != partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    # Only an assigned delivery can move to this stage.
    if delivery.status != DeliveryStatus.ASSIGNED:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot mark arrival when delivery status is "
                f"{delivery.status.value}"
            ),
        )

    now = datetime.now(timezone.utc)

    delivery.status = DeliveryStatus.ARRIVED_AT_SHOP
    delivery.arrived_at_shop_at = now

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Arrival at restaurant recorded successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "arrived_at_shop_at": delivery.arrived_at_shop_at,
    }

@router.post("/deliveries/{delivery_id}/picked-up")
def mark_picked_up(
    delivery_id: int,
    partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    # Find the delivery.
    delivery = db.get(Delivery, delivery_id)

    if delivery is None:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    # Verify that this delivery belongs to the logged-in partner.
    if delivery.delivery_partner_id != partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    # The partner must arrive at the restaurant before pickup.
    if delivery.status != DeliveryStatus.ARRIVED_AT_SHOP:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot mark pickup when delivery status is "
                f"{delivery.status.value}"
            ),
        )

    now = datetime.now(timezone.utc)

    delivery.status = DeliveryStatus.PICKED_UP
    delivery.picked_up_at = now

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Order pickup recorded successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "picked_up_at": delivery.picked_up_at,
    }


@router.post("/deliveries/{delivery_id}/out-for-delivery")
def start_delivery(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    if delivery.delivery_partner_id != current_partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    if delivery.status != DeliveryStatus.PICKED_UP:
        raise HTTPException(
            status_code=409,
            detail="Delivery must be picked up before starting delivery",
        )

    delivery.status = DeliveryStatus.OUT_FOR_DELIVERY
    delivery.out_for_delivery_at = datetime.now(timezone.utc)

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Delivery started successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "out_for_delivery_at": delivery.out_for_delivery_at,
    }

@router.post("/deliveries/{delivery_id}/arrived-at-customer")
def arrived_at_customer(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    # 1. Find the delivery
    delivery = db.get(Delivery, delivery_id)

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found"
        )

    # 2. Verify delivery partner ownership
    if delivery.delivery_partner_id != current_partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you"
        )

    # 3. Validate current delivery status
    if delivery.status != DeliveryStatus.OUT_FOR_DELIVERY:
        raise HTTPException(
            status_code=409,
            detail="Delivery must be OUT_FOR_DELIVERY before arriving at customer"
        )

    # 4. Ensure the delivery start time exists
    if not delivery.out_for_delivery_at:
        raise HTTPException(
            status_code=409,
            detail="Delivery start time is missing"
        )

    # 5. Enforce a 5-minute cooldown from delivery start
    now = datetime.now(timezone.utc)

    start_time = delivery.out_for_delivery_at

    # Handle timestamps returned without timezone information
    # by the database driver.
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    elapsed_seconds = (now - start_time).total_seconds()
    cooldown_seconds = 5 * 60

    if elapsed_seconds < cooldown_seconds:
        remaining_seconds = int(
            cooldown_seconds - elapsed_seconds + 0.999
        )

        raise HTTPException(
            status_code=409,
            detail=(
                "You can mark arrival after the 5-minute delivery period. "
                f"Please wait {remaining_seconds} more seconds."
            )
        )

    # 6. Find the associated order
    order = db.get(Order, delivery.order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Associated order not found"
        )

    # 7. Generate the customer verification OTP
    otp = f"{secrets.randbelow(1_000_000):06d}"

    delivery.status = DeliveryStatus.ARRIVED_AT_CUSTOMER
    delivery.arrived_at_customer_at = now
    delivery.handover_otp = otp
    delivery.handover_otp_attempts = 0
    delivery.handover_otp_expires_at = now + timedelta(minutes=15)

    # 8. Notify the customer through Foodly
    notification = Notification(
        customer_id=order.customer_id,
        order_id=order.order_id,
        title="Delivery Verification OTP",
        message=(
            f"Your order #{order.order_id} has reached your location. "
            f"Your delivery verification OTP is {otp}. "
            "Share this code with your delivery partner to complete "
            "the delivery. This code expires in 15 minutes."
        ),
        notification_type=NotificationType.SYSTEM,
    )

    # 9. Save the delivery and notification together
    try:
        db.add(delivery)
        db.add(notification)
        db.commit()
        db.refresh(delivery)

    except Exception:
        db.rollback()
        raise

    # 10. Never expose the OTP in the partner's response
    return {
        "message": (
            "Arrived at customer location successfully. "
            "OTP notification sent to the customer."
        ),
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "arrived_at_customer_at": delivery.arrived_at_customer_at,
        "otp_expires_at": delivery.handover_otp_expires_at,
    }

@router.get("/deliveries/{delivery_id}/completion-readiness")
def check_delivery_completion_readiness(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    if delivery.delivery_partner_id != current_partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    if delivery.status != DeliveryStatus.ARRIVED_AT_CUSTOMER:
        raise HTTPException(
            status_code=409,
            detail="Delivery must be at the customer location",
        )

    if not delivery.arrived_at_customer_at:
        raise HTTPException(
            status_code=409,
            detail="Customer arrival time has not been recorded",
        )

    elapsed_seconds = (
        datetime.now(timezone.utc) - delivery.arrived_at_customer_at
    ).total_seconds()

    cooldown_seconds = 5 * 60
    remaining_seconds = max(
        0,
        int(cooldown_seconds - elapsed_seconds + 0.999),
    )

    return {
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "cooldown_complete": remaining_seconds == 0,
        "remaining_seconds": remaining_seconds,
        "message": (
            "You can proceed with delivery completion."
            if remaining_seconds == 0
            else f"Please wait {remaining_seconds} seconds before proceeding."
        ),
    }

@router.post("/deliveries/{delivery_id}/generate-handover-otp")
def generate_handover_otp(
    delivery_id: int,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    if delivery.delivery_partner_id != current_partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    if delivery.status != DeliveryStatus.ARRIVED_AT_CUSTOMER:
        raise HTTPException(
            status_code=409,
            detail="Delivery must be at the customer location",
        )

    now = datetime.now(timezone.utc)

    # Load the associated order.
    order = db.get(Order, delivery.order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Associated order not found",
        )

    # If a valid OTP already exists, don't create another notification.
    if (
        delivery.handover_otp
        and delivery.handover_otp_expires_at
        and delivery.handover_otp_expires_at > now
        and delivery.handover_otp_attempts < 5
    ):
        return {
            "message": "A valid OTP has already been sent to the customer",
            "delivery_id": delivery.delivery_id,
            "expires_at": delivery.handover_otp_expires_at,
        }

    # Generate a secure six-digit OTP.
    otp = f"{secrets.randbelow(1_000_000):06d}"

    delivery.handover_otp = otp
    delivery.handover_otp_attempts = 0
    delivery.handover_otp_expires_at = now + timedelta(minutes=15)

    # Create a notification for the customer.
    notification = Notification(
        customer_id=order.customer_id,
        order_id=order.order_id,
        title="Delivery Verification OTP",
        message=(
            f"Your order #{order.order_id} has reached your location. "
            f"Your delivery verification OTP is {otp}. "
            "Share this code with your delivery partner to complete the delivery. "
            "This code expires in 15 minutes."
        ),
        notification_type=NotificationType.SYSTEM,
    )

    db.add(delivery)
    db.add(notification)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "OTP notification sent to the customer's Foodly dashboard",
        "delivery_id": delivery.delivery_id,
        "expires_at": delivery.handover_otp_expires_at,
    }

@router.post("/deliveries/{delivery_id}/verify-handover-otp")
def verify_handover_otp(
    delivery_id: int,
    otp: str,
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    delivery = db.get(Delivery, delivery_id)

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Delivery not found",
        )

    if delivery.delivery_partner_id != current_partner.partner_id:
        raise HTTPException(
            status_code=403,
            detail="This delivery is not assigned to you",
        )

    if delivery.status != DeliveryStatus.ARRIVED_AT_CUSTOMER:
        raise HTTPException(
            status_code=409,
            detail="Delivery must be at the customer location",
        )

    if not delivery.arrived_at_customer_at:
        raise HTTPException(
            status_code=409,
            detail="Customer arrival time has not been recorded",
        )

    now = datetime.now(timezone.utc)

    # Enforce the five-minute cooldown.
    elapsed_seconds = (
        now - delivery.arrived_at_customer_at
    ).total_seconds()

    if elapsed_seconds < 300:
        remaining_seconds = int(300 - elapsed_seconds + 0.999)

        raise HTTPException(
            status_code=409,
            detail=f"Please wait {remaining_seconds} seconds before completing delivery",
        )

    if not delivery.handover_otp or not delivery.handover_otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="No handover OTP has been generated",
        )

    if delivery.handover_otp_expires_at <= now:
        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Generate a new OTP.",
        )

    if delivery.handover_otp_attempts >= 5:
        raise HTTPException(
            status_code=429,
            detail="Maximum OTP attempts exceeded",
        )

    if otp != delivery.handover_otp:
        delivery.handover_otp_attempts += 1
        db.add(delivery)
        db.commit()

        remaining_attempts = max(
            0,
            5 - delivery.handover_otp_attempts,
        )

        raise HTTPException(
            status_code=400,
            detail=f"Incorrect OTP. {remaining_attempts} attempts remaining.",
        )

    # OTP is correct: complete the delivery.
    delivery.status = DeliveryStatus.DELIVERED
    delivery.delivered_at = now

    # Clear the OTP after successful verification.
    delivery.handover_otp = None
    delivery.handover_otp_attempts = 0
    delivery.handover_otp_expires_at = None
    order = db.get(Order, delivery.order_id)

    if not order:
        raise HTTPException(
        status_code=404,
        detail="Associated order not found",
    )

    order.status = OrderStatus.COMPLETED
    db.add(order)
    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return {
        "message": "Delivery completed successfully",
        "delivery_id": delivery.delivery_id,
        "status": delivery.status.value,
        "delivered_at": delivery.delivered_at,
    }


@router.get("/order-history")
def get_delivery_partner_order_history(
    current_partner: DeliveryPartner = Depends(get_current_delivery_partner),
    db: Session = Depends(get_db),
):
    # Fetch completed deliveries belonging to this partner.
    deliveries = db.exec(
        select(Delivery)
        .where(
            Delivery.delivery_partner_id == current_partner.partner_id,
            Delivery.status == DeliveryStatus.DELIVERED,
        )
        .order_by(Delivery.delivered_at.desc())
    ).all()

    history = []
    total_earnings = 0.0

    for delivery in deliveries:
        order = db.get(Order, delivery.order_id)

        shop = db.get(Shop, order.shop_id) if order else None

        partner_earning = float(delivery.partner_earning or 0)
        total_earnings += partner_earning

        history.append({
            "delivery_id": delivery.delivery_id,
            "order_id": delivery.order_id,
            "shop_name": shop.shop_name if shop else "Unknown Restaurant",
            "status": delivery.status.value,
            "delivered_at": delivery.delivered_at,
            "distance_km": delivery.distance_km,
            "partner_earning": partner_earning,
        })

    return {
        "partner_id": current_partner.partner_id,
        "total_completed_deliveries": len(history),
        "total_earnings": round(total_earnings, 2),
        "deliveries": history,
    }