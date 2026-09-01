from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_db
from app.dependencies import get_current_customer
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.customer import Customer
from app.models.menu_item import MenuItem
from app.schemas.cart import AddCartItem,CartResponse,CartItemResponse,UpdateCartItem
from app.models.shop import Shop

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
    # Find the requested menu item
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

    # Find the customer's existing active cart
    cart = db.exec(
        select(Cart).where(
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    # No cart yet -> create one for this item's shop
    if cart is None:

        cart = Cart(
            customer_id=current_customer.customer_id,
            shop_id=menu_item.shop_id
        )

        db.add(cart)
        db.flush()

    # Cart exists for another shop
    elif cart.shop_id != menu_item.shop_id:

        current_shop = db.get(
            Shop,
            cart.shop_id
        )

        requested_shop = db.get(
            Shop,
            menu_item.shop_id
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Your cart contains items from another shop.",
                "current_shop_id": cart.shop_id,
                "current_shop_name": (
                    current_shop.shop_name
                    if current_shop
                    else None
                ),
                "requested_shop_id": menu_item.shop_id,
                "requested_shop_name": (
                    requested_shop.shop_name
                    if requested_shop
                    else None
                )
            }
        )

    # Same shop -> add/update the item
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

    shop = db.get(
        Shop,
        cart.shop_id
    )

    if shop is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
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
        shop_name=shop.shop_name,
        items=response_items,
        total=total
    )

@router.put("/items/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    data: UpdateCartItem,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart_item = db.exec(
        select(CartItem)
        .join(Cart)
        .where(
            CartItem.cart_item_id == cart_item_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    cart_item.quantity = data.quantity

    db.commit()
    db.refresh(cart_item)

    return {
        "message": "Cart item updated successfully",
        "cart_item_id": cart_item.cart_item_id,
        "quantity": cart_item.quantity
    }


@router.delete("/items/{cart_item_id}")
def remove_cart_item(
    cart_item_id: int,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    cart_item = db.exec(
        select(CartItem)
        .join(Cart)
        .where(
            CartItem.cart_item_id == cart_item_id,
            Cart.customer_id == current_customer.customer_id
        )
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    cart = db.get(
        Cart,
        cart_item.cart_id
    )

    db.delete(cart_item)

    db.flush()

    remaining_item = db.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id
        )
    ).first()

    if remaining_item is None:
        db.delete(cart)

    db.commit()

    return {
        "message": "Item removed from cart",
        "cart_item_id": cart_item_id
    }
@router.delete("")
def delete_cart(
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

    for cart_item in cart_items:
        db.delete(cart_item)

    db.flush()

    db.delete(cart)

    db.commit()

    return {
        "message": "Cart cleared successfully"
    }