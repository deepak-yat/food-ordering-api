from fastapi import Depends, HTTPException, status,Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session

from app.database import get_db
from app.models.user import User
from app.security.jwt import decode_access_token
from sqlmodel import Session, select
from app.models.customer import Customer
from app.models.shop import Shop
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer()



def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    access_token: str | None = Cookie(
        default=None
    ),
    db: Session = Depends(get_db)
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    token = None

    # 1. Prefer Authorization: Bearer <token>
    if credentials is not None:
        token = credentials.credentials

    # 2. Otherwise use browser HttpOnly cookie
    elif access_token is not None:
        token = access_token

    if token is None:
        raise credentials_exception

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        raise credentials_exception

    user = db.get(
        User,
        user_id
    )

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user

def get_current_shop(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Shop:

    if current_user.role != UserRole.SHOP_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only shop owners can access shop resources"
        )

    shop = db.exec(
        select(Shop).where(
            Shop.owner_user_id == current_user.user_id
        )
    ).first()

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found for current user"
        )

    if not shop.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop is not approved"
        )

    

    return shop

def require_role(required_role:UserRole):
    def role_checker(
            current_user:User=Depends(get_current_user)
    ):
        if current_user.role !=required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to access !"
            )
        return current_user

    return role_checker


def get_current_customer(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Customer:

    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access customer resources"
        )

    customer = db.exec(
        select(Customer).where(
            Customer.user_id == current_user.user_id
        )
    ).first()

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found"
        )

    return customer

def require_page_role(required_role: UserRole):

    def page_role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:

        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this page"
            )

        return current_user

    return page_role_checker