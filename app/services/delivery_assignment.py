from datetime import datetime, timedelta, timezone
from math import radians, sin, cos, sqrt, atan2

from sqlmodel import Session, select

from app.models.delivery import Delivery, DeliveryStatus
from app.models.delivery_partner import (
    DeliveryPartner,
    DeliveryPartnerStatus,
)
from app.models.order import Order, OrderStatus
from app.models.shop import Shop


OFFER_EXPIRY_MINUTES = 2
MAX_ASSIGNMENT_DISTANCE_KM = 12.0


def calculate_straight_line_distance(
    latitude1: float,
    longitude1: float,
    latitude2: float,
    longitude2: float,
) -> float:
    """Calculate approximate distance between two coordinates using Haversine."""

    earth_radius_km = 6371.0

    lat1 = radians(latitude1)
    lon1 = radians(longitude1)
    lat2 = radians(latitude2)
    lon2 = radians(longitude2)

    latitude_difference = lat2 - lat1
    longitude_difference = lon2 - lon1

    a = (
        sin(latitude_difference / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(longitude_difference / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius_km * c


def create_delivery_assignment(
    db: Session,
    order_id: int,
) -> Delivery:
    """
    Create a delivery record for an order that has reached READY.

    If an eligible delivery partner is available, offer the delivery
    to the nearest partner.

    Otherwise, leave the delivery pending for a future assignment attempt.
    """

    order = db.get(Order, order_id)

    if order is None:
        raise ValueError("Order not found")

    if order.status != OrderStatus.READY:
        raise ValueError("Only READY orders can be assigned for delivery")

    # Avoid creating duplicate delivery records.
    existing_delivery = db.exec(
        select(Delivery).where(Delivery.order_id == order_id)
    ).first()

    if existing_delivery is not None:
        return existing_delivery

    shop = db.get(Shop, order.shop_id)

    if shop is None:
        raise ValueError("Shop not found for this order")

    if shop.latitude is None or shop.longitude is None:
        raise ValueError("Shop location is unavailable")

    # Reuse existing checkout calculations. Do not recalculate the fee.
    delivery = Delivery(
        order_id=order.order_id,
        status=DeliveryStatus.PENDING_OFFER,
        distance_km=order.delivery_distance,
        customer_fee=order.delivery_fee,
        created_at=datetime.now(timezone.utc),
    )

    db.add(delivery)
    db.flush()

    # Find approved, online partners with known coordinates.
    partners = db.exec(
        select(DeliveryPartner).where(
            DeliveryPartner.status == DeliveryPartnerStatus.APPROVED,
            DeliveryPartner.is_online.is_(True),
            DeliveryPartner.latitude.is_not(None),
            DeliveryPartner.longitude.is_not(None),
        )
    ).all()

    eligible_partners = []

    for partner in partners:
        distance = calculate_straight_line_distance(
            shop.latitude,
            shop.longitude,
            partner.latitude,
            partner.longitude,
        )

        if distance <= MAX_ASSIGNMENT_DISTANCE_KM:
            eligible_partners.append((distance, partner))

    # No suitable partner is available. Keep the delivery pending.
    if not eligible_partners:
        db.commit()
        db.refresh(delivery)
        return delivery

    # Offer the delivery to the nearest eligible partner.
    eligible_partners.sort(key=lambda item: item[0])
    _, selected_partner = eligible_partners[0]

    delivery.delivery_partner_id = selected_partner.partner_id
    delivery.status = DeliveryStatus.OFFERED
    delivery.offer_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=OFFER_EXPIRY_MINUTES)
    )
    delivery.offered_to_partner_ids = [selected_partner.partner_id]

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return delivery

def offer_delivery_to_next_partner(
    db: Session,
    delivery: Delivery,
) -> Delivery:
    """Offer a pending delivery to the nearest eligible, untried partner."""

    if delivery.status != DeliveryStatus.PENDING_OFFER:
        raise ValueError("Only pending deliveries can be reassigned")

    # Maximum of 3 distinct partner offers per delivery.
    MAX_PARTNER_ATTEMPTS = 3
    already_offered = list(delivery.offered_to_partner_ids or [])

    # Stop after three partners have been tried.
    if len(already_offered) >= MAX_PARTNER_ATTEMPTS:
        delivery.status = DeliveryStatus.EXPIRED
        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery

    order = db.get(Order, delivery.order_id)

    if order is None:
        raise ValueError("Order not found")

    shop = db.get(Shop, order.shop_id)

    if shop is None or shop.latitude is None or shop.longitude is None:
        raise ValueError("Shop location is unavailable")

    already_offered_ids = set(already_offered)

    partners = db.exec(
        select(DeliveryPartner).where(
            DeliveryPartner.status == DeliveryPartnerStatus.APPROVED,
            DeliveryPartner.is_online.is_(True),
            DeliveryPartner.latitude.is_not(None),
            DeliveryPartner.longitude.is_not(None),
        )
    ).all()

    eligible_partners = []

    for candidate in partners:
        if candidate.partner_id in already_offered_ids:
            continue

        distance = calculate_straight_line_distance(
            shop.latitude,
            shop.longitude,
            candidate.latitude,
            candidate.longitude,
        )

        if distance <= MAX_ASSIGNMENT_DISTANCE_KM:
            eligible_partners.append((distance, candidate))

    # No eligible partner right now: leave the delivery pending.
    # A later retry can search again.
    if not eligible_partners:
        delivery.status = DeliveryStatus.PENDING_OFFER
        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery

    # Choose the nearest eligible partner.
    eligible_partners.sort(key=lambda item: item[0])
    _, selected_partner = eligible_partners[0]

    delivery.delivery_partner_id = selected_partner.partner_id
    delivery.status = DeliveryStatus.OFFERED
    delivery.offer_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=OFFER_EXPIRY_MINUTES)
    )
    delivery.offered_to_partner_ids = [
        *already_offered,
        selected_partner.partner_id,
    ]

    db.add(delivery)
    db.commit()
    db.refresh(delivery)

    return delivery