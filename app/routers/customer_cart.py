from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.schemas.cart import AddCartItem,CartResponse,CartItemResponse


router = APIRouter(
    prefix="/customer/cart",
    tags=["Customer Cart"]
)

@router.post("/items")
def add_to_cart(
    data: AddCartItem,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    menu_item = db.exec(
        select(MenuItem).where(
            MenuItem.item_id == data.menu_item_id
        )
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )

    if not menu_item.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu item is currently unavailable"
        )

    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id,
            Cart.shop_id == menu_item.shop_id
        )
    ).first()

    if cart is None:
        cart = Cart(
            customer_id=current_customer.customer_id,
            shop_id=menu_item.shop_id
        )

        db.add(cart)
        db.flush()

    cart_item = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id,
            CartItem.menu_item_id == data.menu_item_id
        )
    ).first()

    if cart_item:
        cart_item.quantity += data.quantity
    else:
        cart_item = CartItem(
            cart_id=cart.cart_id,
            menu_item_id=data.menu_item_id,
            quantity=data.quantity
        )

        db.add(cart_item)

    db.commit()
    db.refresh(cart_item)

    return {
        "message": "Item added to cart",
        "cart_id": cart.cart_id,
        "cart_item_id": cart_item.cart_item_id,
        "menu_item_id": cart_item.menu_item_id,
        "quantity": cart_item.quantity
    }

@router.get(
    "",
    response_model=CartResponse
)
def get_cart(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart not found"
        )

    cart_items = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
    ).all()

    response_items = []
    total = 0.0

    for cart_item in cart_items:

        menu_item = db.get(
            MenuItem,
            cart_item.menu_item_id
        )

        if menu_item is None:
            continue

        subtotal = (
            menu_item.price *
            cart_item.quantity
        )

        response_items.append(
            CartItemResponse(
                cart_item_id=cart_item.cart_item_id,
                menu_item_id=menu_item.item_id,
                name=menu_item.name,
                quantity=cart_item.quantity,
                unit_price=menu_item.price,
                subtotal=subtotal
            )
        )

        total += subtotal

    return CartResponse(
        cart_id=cart.cart_id,
        shop_id=cart.shop_id,
        items=response_items,
        total=total
    )

