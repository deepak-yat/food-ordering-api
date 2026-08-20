from fastapi import Depends,APIRouter,HTTPException,status
from sqlmodel import Session,select

from app.database import get_db
from app.dependencies import get_current_user,require_role
from app.models.shop import Shop
from app.models.user import User,UserRole


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