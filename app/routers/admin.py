from fastapi import Depends,APIRouter,HTTPException,status
from sqlmodel import Session, select, func
from app.models.message import Message
from app.models.message_recipient import MessageRecipient

from app.models.order import Order, OrderStatus
from app.database import get_db
from app.dependencies import get_current_user,require_role
from app.models.shop import Shop
from app.models.user import User,UserRole
from app.schemas.admin import (
    AdminUserResponse,
    AdminUsersResponse,
    BillingStatusUpdate,
    AdminBroadcastMessage,
    AdminSelectiveMessage
)
from datetime import datetime, timezone
import calendar
from app.models.shop_billing import (
    ShopMonthlyBilling,
    BillingStatus
)
from datetime import timedelta

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/pending-shops")
def get_pending_shops(
    db : Session = Depends(get_db),
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    )
):
    
    shops = db.exec(
        select(Shop).where(
            Shop.is_approved==False
        )
    ).all()

    return shops

@router.put("/shops/{shop_id}/approve")
def approve_shop(
    shop_id:int,
    db:Session = Depends(get_db),
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    )
):
    shop=db.get(
        Shop,
        shop_id
    )
    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop is already approved"
        )
    owner = db.exec(
    select(User).where(
        User.user_id == shop.owner_user_id
    )
    ).first()
    if owner is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="shop owner does not exists"
        )
    shop.is_approved=True
    shop.is_active=True

    owner.is_active=True

    db.commit()

    db.refresh(shop)
    db.refresh(owner)

    return {
        "message": "Shop approved successfully",
        "shop_id": shop.shop_id,
        "owner_user_id": owner.user_id,
        "shop_approved": shop.is_approved,
        "shop_active": shop.is_active,
        "owner_active": owner.is_active
    }

@router.delete("/shops/{shop_id}")
def delete_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    )
):
    shop = db.get(
        Shop,
        shop_id
    )

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    db.delete(shop)
    db.commit()

    return {
        "message": "Shop deleted successfully",
        "shop_id": shop_id
    }

@router.get("/shops")
def get_all_shops(
    current_user : User = Depends(
            require_role(UserRole.ADMIN)
        ),
        db : Session =Depends(get_db)
):
    shops = db.exec(
        select(Shop)
    ).all()

    return shops

@router.get("/shops/{shop_id}")
def get_shop_details(
    shop_id: int,
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db:Session = Depends(get_db)
):
    shop = db.get(
        Shop,
        shop_id
    )

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop Not found"
        )

    return shop


@router.get(
    "/users",
    response_model=AdminUsersResponse
)
def get_all_users(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):
    users = db.exec(
        select(User)
    ).all()

    customers = [
        AdminUserResponse(
            user_id=user.user_id,
            user_name=user.user_name,
            user_email=user.user_email,
            role=user.role.value,
            is_active=user.is_active
        )
        for user in users
        if user.role == UserRole.CUSTOMER
    ]

    shop_owners = [
        AdminUserResponse(
            user_id=user.user_id,
            user_name=user.user_name,
            user_email=user.user_email,
            role=user.role.value,
            is_active=user.is_active
        )
        for user in users
        if user.role == UserRole.SHOP_OWNER
    ]

    return {
        "customers": customers,
        "shop_owners": shop_owners
    }

@router.get("/overview")
def get_admin_overview(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):
    # -----------------------------
    # USER STATISTICS
    # -----------------------------

    total_customers = db.exec(
        select(func.count(User.user_id)).where(
            User.role == UserRole.CUSTOMER
        )
    ).one()

    # -----------------------------
    # SHOP STATISTICS
    # -----------------------------

    total_shops = db.exec(
        select(func.count(Shop.shop_id))
    ).one()

    active_shops = db.exec(
        select(func.count(Shop.shop_id)).where(
            Shop.is_active == True
        )
    ).one()

    pending_shops = db.exec(
        select(func.count(Shop.shop_id)).where(
            Shop.is_approved == False
        )
    ).one()

    # -----------------------------
    # ORDER STATISTICS
    # -----------------------------

    total_orders = db.exec(
        select(func.count(Order.order_id))
    ).one()

    # -----------------------------
    # CURRENT MONTH
    # -----------------------------

    now = datetime.now(timezone.utc)

    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    # -----------------------------
    # CURRENT MONTH REVENUE
    # Only COMPLETED orders count
    # -----------------------------

    monthly_revenue = db.exec(
        select(
            func.coalesce(
                func.sum(Order.total_amount),
                0
            )
        ).where(
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= month_start,
            Order.created_at < now
        )
    ).one()

    # -----------------------------
    # MONTHLY FOODLY PLATFORM FEE
    # -----------------------------

    foodly_revenue = monthly_revenue * 0.03

    # Revenue remaining for shops
    shop_revenue = monthly_revenue - foodly_revenue

    # -----------------------------
    # CURRENT MONTH SHOP-WISE
    # REVENUE
    # -----------------------------

    shop_revenue_query = db.exec(
        select(
            Shop.shop_id,
            Shop.shop_name,
            func.count(Order.order_id),
            func.coalesce(
                func.sum(Order.total_amount),
                0
            )
        )
        .join(
            Order,
            Order.shop_id == Shop.shop_id
        )
        .where(
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= month_start,
            Order.created_at < now
        )
        .group_by(
            Shop.shop_id,
            Shop.shop_name
        )
        .order_by(
            func.sum(Order.total_amount).desc()
        )
    ).all()

    shop_performance = []

    for shop_id, shop_name, order_count, revenue in shop_revenue_query:

        foodly_fee = revenue * 0.03
        shop_earnings = revenue - foodly_fee

        shop_performance.append({
            "shop_id": shop_id,
            "shop_name": shop_name,
            "completed_orders": order_count,
            "revenue": round(revenue, 2),
            "foodly_fee": round(foodly_fee, 2),
            "shop_earnings": round(shop_earnings, 2)
        })

    # -----------------------------
    # LAST 7 DAYS REVENUE
    # Analytics only
    # -----------------------------

    today = now.date()
    start_date = today - timedelta(days=6)

    daily_revenue = []

    for i in range(7):

        current_date = start_date + timedelta(days=i)
        next_date = current_date + timedelta(days=1)

        day_start = datetime.combine(
            current_date,
            datetime.min.time(),
            tzinfo=timezone.utc
        )

        day_end = datetime.combine(
            next_date,
            datetime.min.time(),
            tzinfo=timezone.utc
        )

        result = db.exec(
            select(
                func.count(Order.order_id),
                func.coalesce(
                    func.sum(Order.total_amount),
                    0
                )
            )
            .where(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at >= day_start,
                Order.created_at < day_end
            )
        ).one()

        order_count, revenue = result

        foodly_fee = revenue * 0.03

        daily_revenue.append({
            "date": current_date.isoformat(),
            "completed_orders": order_count,
            "revenue": round(revenue, 2),
            "foodly_fee": round(foodly_fee, 2)
        })

    # -----------------------------
    # RESPONSE
    # -----------------------------

    return {
        "stats": {
            "total_customers": total_customers,
            "total_shops": total_shops,
            "active_shops": active_shops,
            "pending_shops": pending_shops,
            "total_orders": total_orders
        },

        "monthly_business": {
            "month": now.strftime("%Y-%m"),
            "total_shop_revenue": round(monthly_revenue, 2),
            "foodly_fee": round(foodly_revenue, 2),
            "shop_earnings": round(shop_revenue, 2),
            "fee_rate": 3
        },

        "shop_performance": shop_performance,

        "daily_revenue": daily_revenue
    }

@router.post("/billing/generate")
def generate_monthly_billing(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):
    # -----------------------------
    # CURRENT BILLING MONTH
    # -----------------------------

    now = datetime.now(timezone.utc)

    billing_year = now.year
    billing_month = now.month

    month_start = now.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    # Last day of current month
    last_day = calendar.monthrange(
        billing_year,
        billing_month
    )[1]

    due_at = now.replace(
        day=last_day,
        hour=23,
        minute=59,
        second=59,
        microsecond=999999
    )

    # -----------------------------
    # GET ALL SHOPS
    # -----------------------------

    shops = db.exec(
        select(Shop)
    ).all()

    created_bills = []
    skipped_bills = []

    # -----------------------------
    # GENERATE BILL FOR EACH SHOP
    # -----------------------------

    for shop in shops:

        existing_bill = db.exec(
            select(ShopMonthlyBilling).where(
                ShopMonthlyBilling.shop_id == shop.shop_id,
                ShopMonthlyBilling.billing_year == billing_year,
                ShopMonthlyBilling.billing_month == billing_month
            )
        ).first()

        if existing_bill:
            skipped_bills.append({
                "shop_id": shop.shop_id,
                "shop_name": shop.shop_name,
                "reason": "Billing already exists"
            })
            continue

        # -----------------------------
        # CURRENT MONTH COMPLETED REVENUE
        # -----------------------------

        monthly_revenue = db.exec(
            select(
                func.coalesce(
                    func.sum(Order.total_amount),
                    0
                )
            ).where(
                Order.shop_id == shop.shop_id,
                Order.status == OrderStatus.COMPLETED,
                Order.created_at >= month_start,
                Order.created_at < now
            )
        ).one()

        # -----------------------------
        # FOODLY 3% FEE
        # -----------------------------

        foodly_fee = monthly_revenue * 0.03

        # -----------------------------
        # CREATE BILL
        # -----------------------------

        billing = ShopMonthlyBilling(
            shop_id=shop.shop_id,
            billing_year=billing_year,
            billing_month=billing_month,
            total_revenue=round(monthly_revenue, 2),
            fee_rate=0.03,
            fee_amount=round(foodly_fee, 2),
            status=BillingStatus.PENDING,
            due_at=due_at
        )

        db.add(billing)

        created_bills.append({
            "shop_id": shop.shop_id,
            "shop_name": shop.shop_name,
            "total_revenue": round(monthly_revenue, 2),
            "fee_amount": round(foodly_fee, 2),
            "status": BillingStatus.PENDING.value,
            "due_at": due_at
        })

    db.commit()

    return {
        "message": "Monthly billing generation completed",
        "billing_month": f"{billing_year}-{billing_month:02d}",
        "created_count": len(created_bills),
        "skipped_count": len(skipped_bills),
        "created_bills": created_bills,
        "skipped_bills": skipped_bills
    }

@router.get("/billing")
def get_monthly_billing(
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    billing_year = now.year
    billing_month = now.month

    billing_records = db.exec(
        select(
            ShopMonthlyBilling,
            Shop.shop_name
        )
        .join(
            Shop,
            Shop.shop_id == ShopMonthlyBilling.shop_id
        )
        .where(
            ShopMonthlyBilling.billing_year == billing_year,
            ShopMonthlyBilling.billing_month == billing_month
        )
        .order_by(
            ShopMonthlyBilling.fee_amount.desc()
        )
    ).all()

    billing = []

    for record, shop_name in billing_records:
        billing.append({
            "billing_id": record.billing_id,
            "shop_id": record.shop_id,
            "shop_name": shop_name,
            "billing_year": record.billing_year,
            "billing_month": record.billing_month,
            "total_revenue": round(record.total_revenue, 2),
            "fee_rate": record.fee_rate,
            "fee_amount": round(record.fee_amount, 2),
            "status": record.status.value,
            "created_at": record.created_at,
            "paid_at": record.paid_at,
            "due_at": record.due_at
        })

    return {
        "billing_month": f"{billing_year}-{billing_month:02d}",
        "billing": billing
    }

@router.put("/billing/{billing_id}/status")
def update_billing_status(
    billing_id : int,
    billing_data : BillingStatusUpdate,
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db : Session = Depends(get_db)
):
    billing = db.get(
        ShopMonthlyBilling,
        billing_id
    )

    if billing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Billing record not found"
        )

    new_status = billing_data.status

    billing.status=new_status

    if new_status == BillingStatus.PAID:
        billing.paid_at = datetime.now(timezone.utc)

    else:
        billing.paid_at = None

    db.add(billing)
    db.commit()
    db.refresh(billing)

    return {
        "message": "Billing status updated successfully",
        "billing_id": billing.billing_id,
        "shop_id": billing.shop_id,
        "billing_year": billing.billing_year,
        "billing_month": billing.billing_month,
        "fee_amount": round(billing.fee_amount, 2),
        "status": billing.status.value,
        "paid_at": billing.paid_at
    }


@router.post("/messages/broadcast")
def broadcast_message(
    message_data : AdminBroadcastMessage,
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db : Session = Depends(get_db)
):
    # -----------------------------
    # FIND APPROVED SHOPS
    # -----------------------------

    shops = db.exec(
        select(Shop).where(
            Shop.is_approved == True
        )
    ).all()

    if not shops:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No approved shops found"
        )

    # -----------------------------
    # CREATE MESSAGE
    # -----------------------------

    message = Message(
        sender_user_id=current_user.user_id,
        subject=message_data.subject,
        content=message_data.content
    )

    db.add(message)
    db.flush()

    # -----------------------------
    # CREATE RECIPIENTS
    # -----------------------------

    for shop in shops:

        recipient = MessageRecipient(
            message_id=message.message_id,
            shop_id=shop.shop_id
        )

        db.add(recipient)

    db.commit()
    db.refresh(message)

    return {
        "message": "Message sent successfully",
        "message_id": message.message_id,
        "subject": message.subject,
        "recipient_count": len(shops),
        "sent_to": [
            {
                "shop_id": shop.shop_id,
                "shop_name": shop.shop_name
            }
            for shop in shops
        ]
    }

@router.post("/messages/send")
def send_message_to_selected_shops(
    message_data: AdminSelectiveMessage,
    current_user: User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):
    if not message_data.shop_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one shop must be selected"
        )

    shops = db.exec(
        select(Shop).where(
            Shop.shop_id.in_(message_data.shop_ids),
            Shop.is_approved == True
        )
    ).all()

    found_shop_ids = {
        shop.shop_id
        for shop in shops
    }

    missing_shop_ids = [
        shop_id
        for shop_id in message_data.shop_ids
        if shop_id not in found_shop_ids
    ]

    if missing_shop_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Some shops were not found or are not approved",
                "shop_ids": missing_shop_ids
            }
        )

    message = Message(
        sender_user_id=current_user.user_id,
        subject=message_data.subject,
        content=message_data.content
    )

    db.add(message)
    db.flush()

    for shop in shops:
        recipient = MessageRecipient(
            message_id=message.message_id,
            shop_id=shop.shop_id
        )

        db.add(recipient)

    db.commit()
    db.refresh(message)

    return {
        "message": "Message sent successfully",
        "message_id": message.message_id,
        "subject": message.subject,
        "recipient_count": len(shops),
        "sent_to": [
            {
                "shop_id": shop.shop_id,
                "shop_name": shop.shop_name
            }
            for shop in shops
        ]
    }

@router.get("/messages")
def get_admin_messages(
    current_user : User = Depends(
        require_role(UserRole.ADMIN)
    ),
    db : Session = Depends(
        get_db
    )
):
    message_records = db.exec(
        select(
            Message,
            func.count(MessageRecipient.recipient_id)
        )
        .outerjoin(
            MessageRecipient,
            MessageRecipient.message_id == Message.message_id
        )
        .group_by(
            Message.message_id
        )
        .order_by(
            Message.created_at.desc()
        )
    ).all()

    messages=[]

    for message, recipient_count in message_records:
        messages.append({
            "message_id": message.message_id,
            "subject":message.subject,
            "content":message.content,
            "created_at":message.created_at,
            "recipient_count":recipient_count
        })

    return {
        "Messages":messages
    }