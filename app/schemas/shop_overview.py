from datetime import date
from pydantic import BaseModel


class ShopOverviewDetails(BaseModel):
    shop_id: int
    shop_name: str
    description: str | None
    phone: str | None
    is_approved: bool
    is_active: bool


class ShopOverviewSummary(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    top_item: str | None


class RevenueTrendItem(BaseModel):
    date: date
    revenue: float


class OrderTrendItem(BaseModel):
    date: date
    orders: int


class ItemDemandItem(BaseModel):
    item_name: str
    quantity: int
    orders: int
    revenue: float


class StatusDistributionItem(BaseModel):
    status: str
    count: int


class ShopOverviewResponse(BaseModel):
    shop: ShopOverviewDetails
    summary: ShopOverviewSummary
    revenue_trend: list[RevenueTrendItem]
    order_trend: list[OrderTrendItem]
    item_demand: list[ItemDemandItem]
    status_distribution: list[StatusDistributionItem]