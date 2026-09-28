import { useState } from "react";

function formatPrice(value) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function CartOrderSummary({ cart, onCheckout }) {
    const [showPromo, setShowPromo] = useState(false);

    const itemCount = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <aside className="cartpage-summary">

            {/* Header */}
            <div className="cartpage-summary-header">
                <span className="cartpage-summary-icon">₹</span>

                <h3>Order Summary</h3>
            </div>

            {/* Subtotal */}
            <div className="cartpage-summary-row">
                <span>
                    Subtotal ({itemCount} items)
                </span>

                <strong>
                    {formatPrice(cart.total)}
                </strong>
            </div>

            {/* Delivery */}
            <div className="cartpage-summary-row">
                <span>
                    Delivery fee
                    <span className="summary-info-icon">ⓘ</span>
                </span>

                <strong>₹40</strong>
            </div>

            {/* Taxes */}
            <div className="cartpage-summary-row">
                <span>
                    Taxes & charges
                    <span className="summary-info-icon">ⓘ</span>
                </span>

                <strong>₹23</strong>
            </div>

            {/* Divider */}
            <div className="cartpage-summary-divider" />

            {/* Total */}
            <div className="cartpage-total-row">
                <span>Total</span>

                <strong>
                    {formatPrice(
                        Number(cart.total) + 40 + 23
                    )}
                </strong>
            </div>

            {/* Checkout */}
            <button
                type="button"
                className="cartpage-checkout-button"
                onClick={onCheckout}
            >
                <span>Proceed to Checkout</span>
                <span className="checkout-arrow">→</span>
            </button>

            {/* Secure Checkout */}
            <div className="cartpage-secure-note">
                <span>🔒</span>
                <span>
                    Secure checkout with multiple payment options
                </span>
            </div>

            {/* Estimated Delivery */}
            <div className="cartpage-delivery-estimate">
                <span className="delivery-icon">🚚</span>

                <div>
                    <span className="delivery-label">
                        Estimated delivery time
                    </span>

                    <strong>
                        25 – 35 minutes
                    </strong>

                    <span className="delivery-from">
                        from {cart.shop_name}
                    </span>
                </div>
            </div>

            {/* Promo Code */}
            <div className="cartpage-promo">

                <button
                    type="button"
                    className="cartpage-promo-header"
                    onClick={() => setShowPromo(!showPromo)}
                >
                    <span className="promo-icon">🏷️</span>

                    <strong>Have a promo code?</strong>

                    <span
                        className={`promo-chevron ${
                            showPromo ? "open" : ""
                        }`}
                    >
                        ⌃
                    </span>
                </button>

                {showPromo && (
                    <div className="cartpage-promo-form">
                        <input
                            type="text"
                            placeholder="Enter promo code"
                        />

                        <button type="button">
                            Apply
                        </button>
                    </div>
                )}

            </div>

        </aside>
    );
}

export default CartOrderSummary;