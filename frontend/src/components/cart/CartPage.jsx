import CartRestaurantHeader from "./CartRestaurantHeader";
import CartItemCard from "./CartItemCard";
import CartOrderSummary from "./CartOrderSummary";
import CartRecommended from "./CartRecommended";
import CartEmptyState from "./CartEmptyState";
import "../../styles/cart/cart-page.css";

function CartPage({
    cart,
    cartLoading,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
    onCheckout,
    shops = [],
    menu = [],
    selectedShop,
    onViewRestaurant,
    onContinueShopping,
    onAddRecommended,
}) {
    const menuItems = menu.flatMap((category) => category.items || []);

    const menuItemLookup = new Map(
        menuItems.map((item) => [
            item.item_id,
            {
                image_url: item.image_url,
                description: item.description,
            },
        ])
    );

    if (cartLoading) {
        return (
            <section id="customer-cart" className="customer-cart cartpage-section">
                <div className="cartpage-container">
                    <div className="cartpage-loading">Loading cart...</div>
                </div>
            </section>
        );
    }

    if (!cart || !cart.items?.length) {
        return (
            <section id="customer-cart" className="customer-cart cartpage-section">
                <div className="cartpage-container">
                    <CartEmptyState onContinueShopping={onContinueShopping} />
                </div>
            </section>
        );
    }

    return (
        <section id="customer-cart" className="customer-cart cartpage-section">
            <div className="cartpage-container">
                <button
                    type="button"
                    className="cartpage-back-link"
                    onClick={onContinueShopping}
                >
                    ← Continue Shopping
                </button>

                <div className="cartpage-heading">
                    <h2>Your Cart</h2>
                    <p>
                        {cart.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                        )}{" "}
                        items from {cart.shop_name}
                    </p>
                </div>

                <div className="cartpage-layout">
                    <main className="cartpage-main">
                        <CartRestaurantHeader
                            cart={cart}
                            shops={shops}
                            onViewRestaurant={onViewRestaurant}
                        />

                        <div className="cartpage-items">
                            {cart.items.map((item) => (
                                <CartItemCard
                                    key={item.cart_item_id}
                                    item={item}
                                    menuItemLookup={menuItemLookup}
                                    updateCartQuantity={updateCartQuantity}
                                    updateCartOptionQuantity={
                                        updateCartOptionQuantity
                                    }
                                    removeFromCart={removeFromCart}
                                />
                            ))}
                        </div>

                        <CartRecommended
                            menu={menu}
                            selectedShop={selectedShop}
                            cart={cart}
                            onAdd={onAddRecommended}
                        />
                    </main>

                    <CartOrderSummary
                        cart={cart}
                        onCheckout={onCheckout}
                    />
                </div>
            </div>
        </section>
    );
}

export default CartPage;
