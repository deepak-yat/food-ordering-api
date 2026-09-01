from fastapi import Depends,APIRouter,HTTPException,status
from sqlmodel import Session,select

from app.database import get_db
from app.dependencies import get_current_user,require_role
from app.models.shop import Shop
from app.models.user import User,UserRole
from app.schemas.admin import (
    AdminUserResponse,
    AdminUsersResponse
)

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