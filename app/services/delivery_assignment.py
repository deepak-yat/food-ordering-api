from datetime import datetime, timezone

from sqlmodel import Session, select
from datetime import timedelta
from app.models.delivery import Delivery, DeliveryStatus
from app.models.order import Order
from app.models.delivery_partner import DeliveryPartner, DeliveryPartnerStatus
from app.services.routing import calculate_delivery_distance
def create_delivery_for_order(
    order: Order,
    db: Session
) -> Delivery:

    existing_delivery = db.exec(
        select(Delivery).where(
            Delivery.order_id == order.order_id
        )
    ).first()

    if existing_delivery is not None:
        return existing_delivery

    delivery = Delivery(
        order_id=order.order_id,
        status=DeliveryStatus.PENDING_OFFER,
        customer_fee=order.delivery_fee,
        created_at=datetime.now(timezone.utc)
    )

    db.add(delivery)
    db.flush()

    return delivery

def get_nearest_eligible_partners(
    delivery: Delivery,
    order: Order,
    db: Session,
    limit: int = 3
) -> list[DeliveryPartner]:

    partners = db.exec(
        select(DeliveryPartner).where(
            DeliveryPartner.status == DeliveryPartnerStatus.ACTIVE,
            DeliveryPartner.is_online == True,
            DeliveryPartner.latitude.is_not(None),
            DeliveryPartner.longitude.is_not(None),
        )
    ).all()

    eligible_partners = []

    for partner in partners:
        if partner.partner_id in (delivery.offered_to_partner_ids or []):
            continue

        distance = calculate_delivery_distance(
            partner.latitude,
            partner.longitude,
            order.shop.latitude,
            order.shop.longitude,
        )

        eligible_partners.append((distance, partner))

    eligible_partners.sort(key=lambda item: item[0])

    return [
        partner
        for _, partner in eligible_partners[:limit]
    ]

def start_delivery_assignment(
    order: Order,
    delivery: Delivery,
    db: Session
) -> None:

    partners = get_nearest_eligible_partners(
        delivery,
        order,
        db,
        limit=3
    )

    if not partners:
        delivery.status = DeliveryStatus.EXPIRED
        db.add(delivery)
        return

    partner = partners[0]
    partner_earning, platform_fee = split_delivery_fee(
    delivery.customer_fee or 0.0
        )

    delivery.partner_earning = partner_earning
    delivery.platform_fee = platform_fee
    delivery.delivery_partner_id = partner.partner_id
    delivery.status = DeliveryStatus.OFFERED
    delivery.offer_expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=90)
    )
    delivery.offered_to_partner_ids = [
        *(delivery.offered_to_partner_ids or []),
        partner.partner_id
    ]

    db.add(delivery)

def offer_next_candidate(
    order: Order,
    delivery: Delivery,
    db: Session
) -> bool:

    if len(delivery.offered_to_partner_ids or []) >= 3:
        delivery.status = DeliveryStatus.EXPIRED
        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        db.add(delivery)
        return False

    partners = get_nearest_eligible_partners(
        delivery,
        order,
        db,
        limit=3
    )

    if not partners:
        delivery.status = DeliveryStatus.EXPIRED
        delivery.delivery_partner_id = None
        delivery.offer_expires_at = None
        db.add(delivery)
        return False

    partner = partners[0]

    delivery.delivery_partner_id = partner.partner_id
    delivery.status = DeliveryStatus.OFFERED
    delivery.offer_expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=90)
    )
    delivery.offered_to_partner_ids = [
        *(delivery.offered_to_partner_ids or []),
        partner.partner_id
    ]

    db.add(delivery)

    return True


def split_delivery_fee(
        customer_fee : float 
) -> tuple [float, float]:
    partner_earning = round(customer_fee * 0.80, 2)
    platform_fee = round(customer_fee - partner_earning, 2)

    return partner_earning, platform_fee

