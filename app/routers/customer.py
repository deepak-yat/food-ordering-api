from fastapi import Depends, HTTPException, status , APIRouter
from sqlmodel import Session,select

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.customer import Customer
from app.models.user import User
from app.models.customer_addresses import CustomerAddress
from app.schemas.customer import (
    CustomerAddressCreate,
    CustomerAddressResponse,
    CustomerAddressUpdate,
    CustomerProfileResponse,
    CustomerProfileUpdate,
    CurrentLocationRequest,
    DeliveryChargeRequest,
    DeliveryChargeResponse
)
from app.models.shop import Shop
from app.services.routing import calculate_delivery_distance
from app.services.delivery import calculate_delivery_fee
from app.services.geocoding import geo_code_address,reverse_geocode
import requests
router = APIRouter(
    prefix="/customer",
    tags=["Customer Address"]
)

@router.post(
    "/addresses",
    response_model=CustomerAddressResponse,
    status_code=status.HTTP_201_CREATED
)
def create_address(
    data: CustomerAddressCreate,
    db: Session = Depends(get_db),
    current_customer: User = Depends(get_current_customer)
):
    if data.is_default:
        existing_default = db.exec(
            select(CustomerAddress).where(
                CustomerAddress.customer_id == current_customer.customer_id,
                CustomerAddress.is_default == True
            )
        ).all()

        for address in existing_default:
            address.is_default = False

    # Build complete address
    full_address = ", ".join(
        part for part in [
            data.address_line1,
            data.address_line2,
            data.city,
            data.state,
            data.pincode
        ]
        if part
    )

    # Use provided coordinates if available.
    # Otherwise, geocode the address.
    if data.latitude is not None and data.longitude is not None and data.latitude !=0 and data.longitude !=0:

        latitude = data.latitude
        longitude = data.longitude

    else:

        try:
            latitude, longitude = geo_code_address(full_address)

        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(error)
            )

        except requests.RequestException:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to verify customer location"
            )

    new_address = CustomerAddress(
        customer_id=current_customer.customer_id,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        is_default=data.is_default,
        latitude=latitude,
        longitude=longitude
    )

    db.add(new_address)

    db.commit()

    db.refresh(new_address)

    return new_address

@router.get(
    "/addresses",
    response_model=list[CustomerAddressResponse],
    status_code=status.HTTP_200_OK
)
def get_addresses(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    addresses = db.exec(
        select(CustomerAddress).where(
            CustomerAddress.customer_id == current_customer.customer_id
        )
    ).all()

    return addresses



@router.put("/addresses/{address_id}",
            response_model=CustomerAddressResponse,
            )
def update_address(
    address_id : int,
    data : CustomerAddressUpdate,
    db : Session = Depends(get_db),
    current_customer : User = Depends(get_current_customer)
):
    address = db.exec(
        select(CustomerAddress).where(
            CustomerAddress.address_id==address_id,
            CustomerAddress.customer_id==current_customer.customer_id
        )
    ).first()

    if address is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided"
        )

    if update_data.get("is_default") is True:

        existing_default_addresses = db.exec(
            select(CustomerAddress).where(
                CustomerAddress.customer_id == current_customer.customer_id,
                CustomerAddress.is_default == True,
                CustomerAddress.address_id != address_id
            )
        ).all()

        for existing_address in existing_default_addresses:
            existing_address.is_default = False

    for field, value in update_data.items():
        setattr(address, field, value)
    db.add(address)
    db.commit()
    db.refresh(address)

    return address

@router.delete(
    "addresses/{address_id}",
    status_code=status.HTTP_200_OK
)
def delete_address(
    address_id : int,
    db : Session = Depends(get_db),
    current_customer : User = Depends(get_current_customer),
):
    address = db.exec(
        select(CustomerAddress).where(
            CustomerAddress.address_id==address_id,
            CustomerAddress.customer_id==current_customer.customer_id
        )
    ).first()

    if address is None:
        raise  HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )

    db.delete(address)

    db.commit()

    return {
        "message": "Address deleted successfully"
    }


@router.put(
    "/profile",
    response_model=CustomerProfileResponse
)
def update_profile(
    data: CustomerProfileUpdate,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No changes provided"
        )

    for field, value in update_data.items():
        setattr(current_customer, field, value)

    db.add(current_customer)
    db.commit()
    db.refresh(current_customer)

    return current_customer

@router.get(
    "/profile",
    response_model=CustomerProfileResponse
)
def get_profile(
    current_customer: Customer = Depends(get_current_customer)
):
    return current_customer

@router.post("/addresses/reverse-geocode")
def reverse_geocode_location(
    data: CurrentLocationRequest,
    current_customer: Customer = Depends(get_current_customer)
):
    try:
        return reverse_geocode(
            data.latitude,
            data.longitude
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to determine your address"
        )

@router.post("/delivery-charge",
             response_model=DeliveryChargeResponse)
def get_delivery_charge(
    data : DeliveryChargeRequest,
    db : Session = Depends(get_db),
    current_customer: Customer = Depends(
        get_current_customer
    )
):
    address = db.exec(
        select(CustomerAddress).where(
            CustomerAddress.address_id==data.address_id,
            CustomerAddress.customer_id==current_customer.customer_id

        )
    ).first()

    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not Found"
        )
    if (
        address.latitude is None
        or address.longitude is None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address has no valid coordinates"
        )

    shop = db.exec(
        select(Shop).where(
            Shop.shop_id == data.shop_id,
            Shop.is_approved == True,
            Shop.is_active == True
        )
    ).first()

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    # Make sure shop location exists
    if (
        shop.latitude is None
        or shop.longitude is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop does not have a valid location"
        )

    try:
        distance_km = calculate_delivery_distance(
            shop.latitude,
            shop.longitude,
            address.latitude,
            address.longitude
        )

        delivery_fee=calculate_delivery_fee(
            distance_km
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )
    
    return {
        "shop_id" : shop.shop_id,
        "address_id" : address.address_id,
        "distance_km" : distance_km,
        "delivery_fee" : delivery_fee
    }