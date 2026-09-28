function formatPrice(value) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function CartOrderSummary({ cart, onCheckout }) {
    return (
        <aside className="cartpage-summary">
            <div className="cartpage-summary-header">
                <span className="cartpage-summary-icon">₹</span>
                <h3>Order Summary</h3>
            </div>

            <div className="cartpage-summary-row">
                <span>
                    Subtotal (
                    {cart.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                    )}{" "}
                    items)
                </span>
                <strong>{formatPrice(cart.total)}</strong>
            </div>

            <p className="cartpage-checkout-note">
                Delivery fee and taxes are calculated at checkout.
            </p>

            <div className="cartpage-summary-divider" />

            <div className="cartpage-total-row">
                <span>Total</span>
                <strong>{formatPrice(cart.total)}</strong>
            </div>

            <button
                type="button"
                className="cartpage-checkout-button"
                onClick={onCheckout}
            >
                Proceed to Checkout →
            </button>

            <div className="cartpage-secure-note">
                🔒 Secure checkout
            </div>
        </aside>
    );
}

export default CartOrderSummary;
