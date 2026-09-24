from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from datetime import datetime, timedelta
import hashlib
import secrets
import os
import secrets
from datetime import datetime, timedelta
from app.services.email import send_password_reset_email
from app.models.password_reset_token import PasswordResetToken
from app.database import get_db
from app.dependencies import get_current_user
from app.models.customer import Customer
from app.models.shop import Shop
from app.models.user import User, UserRole
from app.schemas.auth import (
    CustomerRegister,
    GoogleLoginRequest,
    CustomerRegisterResponse,
    LoginRequest,
    ShopRegister,
    ShopRegisterResponse,
    ResetPasswordRequest,
    ForgotPasswordRequest,
    RegisterVerificationRequest,
    VerifyRegistrationRequest,
)
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify
from app.services.geocoding import geo_code_address
import requests
from app.services.google_auth import verify_google_id_token
from app.services.username import generate_unique_username
from app.models.email_verification import EmailVerification
from app.services.email import send_email_verification_code
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
def hash_reset_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


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


@router.post("/register/start")
def start_registration_verification(
    data: RegisterVerificationRequest,
    db: Session = Depends(get_db)
):
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

    verification_code = f"{secrets.randbelow(1_000_000):06d}"

    password_hash = hash_password(data.password)

    expires_at = datetime.utcnow() + timedelta(minutes=10)

    existing_verification = db.exec(
    select(EmailVerification).where(
        EmailVerification.email == data.user_email
    )
    ).first()

    if existing_verification:
        if datetime.utcnow() > existing_verification.expires_at:
            db.delete(existing_verification)
            db.commit()
        else:
            db.delete(existing_verification)
            db.commit()

    verification = EmailVerification(
        email=data.user_email,
        user_name=data.user_name,
        password_hash=password_hash,
        code=verification_code,
        expires_at=expires_at
    )

    db.add(verification)
    db.commit()

    send_email_verification_code(
        data.user_email,
        verification_code
    )

    return {
        "message": "Verification code sent to your email"
    }


@router.post("/register/verify")
def verify_registration(
    data: VerifyRegistrationRequest,
    db: Session = Depends(get_db)
):
    verification = db.exec(
        select(EmailVerification).where(
            EmailVerification.email == data.email
        )
    ).first()

    if verification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found"
        )

    if datetime.utcnow() > verification.expires_at:
        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired"
        )

    if verification.code != data.verification_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )

    existing_user = db.exec(
        select(User).where(
            User.user_email == verification.email
        )
    ).first()

    if existing_user:
        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists with this email"
        )

    existing_username = db.exec(
        select(User).where(
            User.user_name == verification.user_name
        )
    ).first()

    if existing_username:
        db.delete(verification)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    new_user = User(
        user_name=verification.user_name,
        user_email=verification.email,
        password_hash=verification.password_hash,
        role=UserRole.CUSTOMER,
        is_active=True
    )

    db.add(new_user)
    db.flush()

    new_customer = Customer(
        user_id=new_user.user_id,
        customer_name=verification.user_name
    )

    db.add(new_customer)

    db.delete(verification)

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
    shop_address = ", ".join(
        part for part in[
            data.address_line1,
            data.address_line2,
            data.city,
            data.state,
            data.pincode
        ]
        if part
    )

    try :
        latitude, longitude = geo_code_address(shop_address)
    except ValueError as error :
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            datail=str(error)
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
        is_active=False,

        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        state=data.state,
        pincode=data.pincode,

        latitude=latitude,
        longitude=longitude
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
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google Sign-In. Use the Continue with Google button instead.",
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
# GOOGLE LOGIN
# =========================================================

@router.post("/google")
def google_login(
    data: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    try:
        claims = verify_google_id_token(data.id_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google sign-in token"
        )

    google_id = claims["sub"]
    email = claims["email"]
    name = claims.get("name") or email.split("@")[0]

    # First try to find an account already linked to this Google account
    user = db.exec(
        select(User).where(
            User.google_id == google_id
        )
    ).first()

    if user is None:

        # If no Google link exists, check for an existing
        # Foodly account with the same verified email.
        user = db.exec(
            select(User).where(
                User.user_email == email
            )
        ).first()

        if user is not None:

            # Link Google to the existing Foodly account.
            user.google_id = google_id

            db.add(user)
            db.commit()
            db.refresh(user)

        else:

            # Brand-new Google users become customers.
            username = generate_unique_username(
                db,
                email,
                name
            )

            user = User(
                user_name=username,
                user_email=email,
                password_hash=None,
                role=UserRole.CUSTOMER,
                is_active=True,
                google_id=google_id
            )

            db.add(user)

            # Get user_id before creating Customer
            db.flush()

            new_customer = Customer(
                user_id=user.user_id,
                customer_name=name
            )

            db.add(new_customer)

            # User + Customer are committed together
            db.commit()
            db.refresh(user)

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

@router.post("/forgot-password")
def forgot_password(
    data : ForgotPasswordRequest,
    db : Session = Depends(get_db)
):
    generic_message = (
        "If a account exists with this email, "
        "a password reset link has been send."
    )

    user = db.exec(
        select(User).where(
            User.user_email==data.user_email
        )
    ).first()

    if user is None:
        return{
            "generic_message":generic_message
        }

    existing_tokens = db.exec(
    select(PasswordResetToken).where(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.utcnow()
    )
    ).all()

    for existing_token in existing_tokens:
        existing_token.used_at = datetime.utcnow()
        db.add(existing_token)
    
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_reset_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(
        minutes=15
    )

    reset_token = PasswordResetToken(
        user_id = user.user_id,
        token_hash = token_hash,
        expires_at=expires_at
    )

    db.add(reset_token)
    db.commit()
    frontend_url = os.getenv(
    "FRONTEND_URL",
    "http://127.0.0.1:5173"
)

    reset_link = (
    f"{frontend_url}/reset-password"
    f"?token={raw_token}"
)

    try:
        send_password_reset_email(
        recipient_email=user.user_email,
        reset_link=reset_link
    )

    except Exception:
    # Do not reveal email-delivery problems
    # to the user.
        print("Failed to send password reset email")
    return {
        "message": generic_message
    }

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    token_hash = hash_reset_token(data.token)

    reset_token = db.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash
        )
    ).first()

    if reset_token is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )

    now = datetime.utcnow()

    if reset_token.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )

    if reset_token.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )

    user = db.exec(
        select(User).where(
            User.user_id == reset_token.user_id
        )
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link"
        )

    # Update password
    user.password_hash = hash_password(data.new_password)

    # Invalidate token immediately
    reset_token.used_at = now

    db.add(user)
    db.add(reset_token)

    db.commit()

    return {
        "message": "Password reset successfully"
    }


@router.post("/register/resend")
def resend_registration_verification(
    data: RegisterVerificationRequest,
    db: Session = Depends(get_db)
):
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

    verification_code = f"{secrets.randbelow(1_000_000):06d}"

    password_hash = hash_password(data.password)

    expires_at = datetime.utcnow() + timedelta(minutes=10)

    existing_verification = db.exec(
        select(EmailVerification).where(
            EmailVerification.email == data.user_email
        )
    ).first()

    if existing_verification:
        db.delete(existing_verification)
        db.commit()

    verification = EmailVerification(
        email=data.user_email,
        user_name=data.user_name,
        password_hash=password_hash,
        code=verification_code,
        expires_at=expires_at
    )

    db.add(verification)
    db.commit()

    send_email_verification_code(
        data.user_email,
        verification_code
    )

    return {
        "message": "A new verification code has been sent to your email"
    }