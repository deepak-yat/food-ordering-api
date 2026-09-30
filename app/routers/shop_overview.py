from collections import defaultdict
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_shop

from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.shop import Shop

from app.schemas.shop_overview import (
    ShopOverviewResponse,
    ShopOverviewDetails,
    ShopOverviewSummary,
    RevenueTrendItem,
    OrderTrendItem,
    ItemDemandItem,
    StatusDistributionItem,
)

router = APIRouter(
    prefix="/shop",
    tags=["Shop Overview"]
)

@router.get(
    "/overview",
    response_model=ShopOverviewResponse
)
def get_shop_overview(
    current_shop: Shop = Depends(get_current_shop),
    db: Session = Depends(get_db)
):
    # ------------------------------------------------
    # 1. Get this shop's orders only
    # ------------------------------------------------

    orders = db.exec(
        select(Order).where(
            Order.shop_id == current_shop.shop_id
        )
    ).all()

    # ------------------------------------------------
    # 2. Basic order/status statistics
    # ------------------------------------------------

    total_orders = len(orders)

    status_counts = defaultdict(int)

    for order in orders:
        status_counts[order.status.value] += 1

    # ------------------------------------------------
    # 3. Revenue
    # ------------------------------------------------
    # Revenue is counted only for completed orders.
    # Rejected/cancelled/pending orders are not revenue.

    completed_orders = [
        order
        for order in orders
        if order.status == OrderStatus.COMPLETED
    ]

    total_revenue = sum(
        order.total_amount
        for order in completed_orders
    )

    average_order_value = (
        total_revenue / len(completed_orders)
        if completed_orders
        else 0.0
    )

    # ------------------------------------------------
    # 4. Item analytics
    # ------------------------------------------------

    item_quantity = defaultdict(int)
    item_orders = defaultdict(int)
    item_revenue = defaultdict(float)

    for order in orders:

        order_items = db.exec(
            select(OrderItem).where(
                OrderItem.order_id == order.order_id
            )
        ).all()

        # Don't count rejected/cancelled orders toward
        # demand/revenue analytics.
        if order.status in {
            OrderStatus.REJECTED,
            OrderStatus.CANCELLED,
        }:
            continue

        seen_items = set()

        for item in order_items:

            item_quantity[item.item_name] += item.quantity
            item_revenue[item.item_name] += item.subtotal

            if item.item_name not in seen_items:
                item_orders[item.item_name] += 1
                seen_items.add(item.item_name)

    item_names = set(item_quantity.keys())

    item_demand = [
        ItemDemandItem(
            item_name=item_name,
            quantity=item_quantity[item_name],
            orders=item_orders[item_name],
            revenue=item_revenue[item_name]
        )
        for item_name in item_names
    ]

    item_demand.sort(
        key=lambda item: item.quantity,
        reverse=True
    )

    top_item = (
        item_demand[0].item_name
        if item_demand
        else None
    )

    # ------------------------------------------------
    # 5. Revenue / order trends
    # ------------------------------------------------

    today = datetime.now(timezone.utc).date()

    start_date = today - timedelta(days=29)

    revenue_by_date = defaultdict(float)
    orders_by_date = defaultdict(int)

    for order in orders:

        order_date = order.created_at.date()

        if order_date < start_date:
            continue

        if order.status not in {
            OrderStatus.REJECTED,
            OrderStatus.CANCELLED,
        }:
            orders_by_date[order_date] += 1

        if order.status == OrderStatus.COMPLETED:
            revenue_by_date[order_date] += order.total_amount

    revenue_trend = []

    order_trend = []

    for day_offset in range(30):

        current_date = (
            start_date +
            timedelta(days=day_offset)
        )

        revenue_trend.append(
            RevenueTrendItem(
                date=current_date,
                revenue=revenue_by_date[current_date]
            )
        )

        order_trend.append(
            OrderTrendItem(
                date=current_date,
                orders=orders_by_date[current_date]
            )
        )

    # ------------------------------------------------
    # 6. Return analytics
    # ------------------------------------------------

    return ShopOverviewResponse(

        shop=ShopOverviewDetails(
            shop_id=current_shop.shop_id,
            shop_name=current_shop.shop_name,
            description=current_shop.description,
            phone=current_shop.phone,
            is_approved=current_shop.is_approved,
            is_active=current_shop.is_active
        ),

        summary=ShopOverviewSummary(
            total_revenue=total_revenue,
            total_orders=total_orders,
            average_order_value=average_order_value,
            top_item=top_item
        ),

        revenue_trend=revenue_trend,

        order_trend=order_trend,

        item_demand=item_demand,

        status_distribution=[
            StatusDistributionItem(
                status=status_name,
                count=count
            )
            for status_name, count in status_counts.items()
        ]
    )