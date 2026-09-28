import { useCustomer } from "../context/CustomerContext";
import { useEffect } from "react";
import CartRestaurantHeader from "../components/cart/CartRestaurantHeader";
import CartItemCard from "../components/cart/CartItemCard";
import CartOrderSummary from "../components/cart/CartOrderSummary";
import CartEmptyState from "../components/cart/CartEmptyState";
import CartRecommended from "../components/cart/CartRecommended";
import { apiFetch } from "../api/client";
import "../styles/cart/cart-page.css";
import { useNavigate } from "react-router-dom";

function CustomerCart() {
    const navigate = useNavigate();
   const {
    cart,
    cartLoading,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
    addToCart,
    selectedShop,
    menu,
    setSelectedShop,
    setMenu
} = useCustomer();
useEffect(() => {
    if (!cart?.shop_id) {
        return;
    }
    
    async function loadCartShopMenu() {
        try {
            const data = await apiFetch(
                `/customer/view-shop/${cart.shop_id}/menu`
            );
            setSelectedShop({
    shop_id: cart.shop_id,
    shop_name: cart.shop_name
});

            setMenu(data);

        } catch (error) {
            console.error(
                "Unable to load cart shop menu:",
                error
            );
        }
    }

    loadCartShopMenu();
}, [cart?.shop_id, setMenu]);
    if (cartLoading) {
        return (
            <div className="cartpage">
                <div className="cartpage-container">
                    <p>Loading cart...</p>
                </div>
            </div>
        );
    }

    if (!cart || !cart.items?.length) {
        return (
            <div className="cartpage">
                <div className="cartpage-container">
                    <CartEmptyState
                        onContinueShopping={() =>
                            window.history.back()
                        }
                    />
                </div>
            </div>
        );
    }
const menuItemLookup = new Map(
    menu
        .flatMap((category) => category.items || [])
        .map((item) => [item.item_id, item])
);
    return (
        <div className="cartpage">
            <div className="cartpage-container">

                {/* Continue Shopping */}
                <button
                    type="button"
                    className="cartpage-continue-button"
                    onClick={() => window.history.back()}
                >
                    ← Continue Shopping
                </button>

                {/* Page Heading */}
                <div className="cartpage-heading">
                    <h1>Your Cart</h1>

                    <p>
                        {cart.items.reduce(
                            (total, item) =>
                                total + item.quantity,
                            0
                        )}{" "}
                        items from {cart.shop_name}
                    </p>
                </div>

                {/* Main Content */}
                <div className="cartpage-main">

                    {/* LEFT */}
                    <div className="cartpage-left">

                        <div className="cartpage-cart-card">

                           <CartRestaurantHeader
    cart={cart}
    onViewRestaurant={() => {
        navigate("/customer/dashboard");
    }}
/>

                            <div className="cartpage-items">
                                {cart.items.map((item) => (
                                    <CartItemCard
                                        key={item.cart_item_id}
                                        item={item}
                                        menuItemLookup={menuItemLookup}
                                        updateCartQuantity={
                                            updateCartQuantity
                                        }
                                        updateCartOptionQuantity={
                                            updateCartOptionQuantity
                                        }
                                        removeFromCart={
                                            removeFromCart
                                        }
                                    />
                                ))}
                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="cartpage-right">

                        <CartOrderSummary
                            cart={cart}
                            onCheckout={() => {
                                // Checkout wiring will be connected next.
                            }}
                        />

                    </div>

                </div>

                <CartRecommended
    menu={menu}
    selectedShop={selectedShop}
    cart={cart}
    onAdd={(itemId) => {
    addToCart(itemId);
}}
/>

            </div>
        </div>
    );
}

export default CustomerCart;