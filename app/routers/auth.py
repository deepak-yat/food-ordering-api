from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.customer import Customer
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.schemas.auth import (
    CustomerRegister,
    CustomerRegisterResponse,
    LoginRequest,
    ShopRegister,
    ShopRegisterResponse
)
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# CUSTOMER REGISTRATION
# =========================================================

@router.post("/register",
            response_model=CustomerRegisterResponse )
def register_customer(
    data: CustomerRegister,
    db: Session = Depends(get_db)
):
    # Check email
    existing_user = db.exec(
        select(User).where(
            User.user_email == data.user_email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists with this email"
        )

    # Check username
    existing_username = db.exec(
        select(User).where(
            User.user_name == data.user_name
        )
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    # Create user
    new_user = User(
        user_name=data.user_name,
        user_email=data.user_email,
        password_hash=hash_password(data.password),
        role=UserRole.CUSTOMER,
        is_active=True
    )

    db.add(new_user)

    # Get generated user_id without committing yet
    db.flush()

    # Create customer profile
    new_customer = Customer(
        user_id=new_user.user_id,
        customer_name=data.user_name
    )

    db.add(new_customer)

    # Commit both together
    db.commit()

    db.refresh(new_user)
    db.refresh(new_customer)

    return {
        "message": "Customer registered successfully",
        "user_id": new_user.user_id,
        "customer_id": new_customer.customer_id
    }


# =========================================================
# SHOP OWNER REGISTRATION
# =========================================================

@router.post("/register/shop",
             response_model=ShopRegisterResponse)
def register_shop(
    data: ShopRegister,
    db: Session = Depends(get_db)
):
    # Check email
    existing_user = db.exec(
        select(User).where(
            User.user_email == data.user_email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    # Check username
    existing_username = db.exec(
        select(User).where(
            User.user_name == data.user_name
        )
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    # Check shop name
    existing_shop = db.exec(
        select(Shop).where(
            Shop.shop_name == data.shop_name
        )
    ).first()

    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shop with this name already exists"
        )

    # Create shop owner user
    new_user = User(
        user_name=data.user_name,
        user_email=data.user_email,
        password_hash=hash_password(data.password),
        role=UserRole.SHOP_OWNER,
        is_active=False
    )

    db.add(new_user)

    # Generate user_id without committing
    db.flush()

    # Create shop in pending state
    new_shop = Shop(
        shop_name=data.shop_name,
        description=data.description,
        owner_user_id=new_user.user_id,
        is_approved=False,
        is_active=False
    )

    db.add(new_shop)

    # Commit User + Shop together
    db.commit()

    db.refresh(new_user)
    db.refresh(new_shop)

    return {
        "message": (
            "Shop registration submitted successfully. "
            "Waiting for admin approval."
        ),
        "user_id": new_user.user_id,
        "shop_id": new_shop.shop_id
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    credentials: LoginRequest,
    response : Response,
    db: Session = Depends(get_db)
):
    user = db.exec(
        select(User).where(
            User.user_name == credentials.user_name
        )
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    if not verify(
        credentials.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token = create_access_token(
        user_id=user.user_id,
        role=user.role.value
    )
    response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=False,
    samesite="lax",
    max_age=30 * 60
)

    return {
    "access_token": access_token,
    "token_type": "bearer",
    "user": {
        "user_id": user.user_id,
        "user_name": user.user_name,
        "role": user.role.value
    }
}


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "user_id": current_user.user_id,
        "user_name": current_user.user_name,
        "user_email": current_user.user_email,
        "role": current_user.role.value,
        "is_active": current_user.is_active
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token"
    )

    return {
        "message": "Logged out successfully"
    }