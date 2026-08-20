from fastapi import APIRouter, Depends , HTTPException , status

from sqlmodel import Session , select

from app.dependencies import get_current_user
from app.database import get_db
from app.models.customer import Customer
from app.models.user import User,UserRole
from app.schemas.auth import CustomerRegister,LoginRequest
from app.security.password import hash_password,verify
from app.security.jwt import create_access_token
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.schemas.auth import (
    CustomerRegister,
    LoginRequest,
    ShopRegister
)
router=APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/register",
)
def register_customer(
    data:CustomerRegister,
    db:Session=Depends(get_db)
):
    existing_user=db.exec(
        select(User).where(
            User.user_email==data.user_email
        )
    ).first()

    if existing_user :
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            Detail="User already exists with this email"
        )

    new_user = User(
        user_name=data.user_name,
        user_email=data.user_email,
        password_hash=hash_password(data.password),
        role=UserRole.CUSTOMER,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_customer=Customer(
        user_id=new_user.user_id,
        customer_name=data.user_name
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return {
        "message" : "Customer registered successfully",
        "User id" : new_user.user_id,
        "customer_id" : new_customer.customer_id
    }

@router.post("/login")
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    statement = select(User).where(
        User.user_name == credentials.user_name
    )

    user = db.exec(statement).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    if not verify(
        credentials.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
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

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

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

@router.post(
    "/register/shop"
)
def register_shop(
     data:ShopRegister,
    db:Session=Depends(get_db),
):
    existing_user=db.exec(
        select(User).where(
            User.user_email == data.user_email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    existing_shop=db.exec(
        select(Shop).where(
            Shop.shop_name==data.shop_name
        )
    ).first()

    if existing_shop:
        raise HTTPException(
            status_code=409,
            detail="Shop with this name already exists"
        )

    new_user=User(
        user_name=data.user_name,
        user_email=data.user_email,
        password_hash=hash_password(data.password),
        role=UserRole.SHOP_OWNER,
        is_active=False
    )
    db.add(new_user)
    db.flush()

    new_shop=Shop(
        shop_name=data.shop_name,
        owner_user_id=new_user.user_id,
        is_approved=False,
        is_active=False,
        description=data.description
    )
    db.add(new_shop)
    db.commit()
    db.refresh(new_user)
    db.refresh(new_shop)

    return {
        "message":(
            "New user submitted successfully",
            "New shop added successfully"
        ),
        "user_id":new_user.user_id,
        "shop_id":new_shop.shop_id
    }