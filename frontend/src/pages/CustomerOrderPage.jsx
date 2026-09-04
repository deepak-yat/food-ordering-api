import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "../api/client";
function CustomerOrderPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const { cart, address } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState("");
    const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
const [placingOrder, setPlacingOrder] = useState(false);
const [orderError, setOrderError] = useState("");
    if (!cart || !address) {
        return (
            <div className="customer-order-page">
                <p className="status-text">
                    Order details are unavailable.
                </p>

                <button
                    className="secondary-button"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        );
    }

    async function confirmAndPlaceOrder() {
    setPlacingOrder(true);
    setOrderError("");

    try {
        const data = await apiFetch(
            "/customer/orders",
            {
                method: "POST",
                body: JSON.stringify({
                    cart_id: cart.cart_id,
                    address_id: address.address_id,
                }),
            }
        );

        console.log("ORDER CREATED:", data);

        setShowOrderConfirmation(false);

        navigate("/customer/dashboard");

    } catch (error) {

        console.error(
            "Order creation failed:",
            error
        );

        setOrderError(
            error.message || "Failed to place order"
        );

    } finally {
        setPlacingOrder(false);
    }
}

    return (
        <div className="customer-order-page">

            {/* Header */}
            <div className="customer-order-header">
                <div>
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button> 
                </div>
                <div>
                    <span className="eyebrow">
                        ORDER REVIEW
                    </span>

                    <h1>
                        Review Your Order
                    </h1>
                </div>

            </div>


            {/* Cart */}
            <section className="customer-order-section">

                <span className="eyebrow">
                    YOUR ORDER
                </span>

                <div className="customer-order-items">

                    {cart.items.map((item) => (
                        <div
                            key={item.cart_item_id}
                            className="customer-order-item"
                        >

                            <div className="customer-order-item-info">

                                <strong>
                                    {item.name}
                                </strong>

                                <span>
                                    ₹{item.unit_price} × {item.quantity}
                                </span>

                            </div>

                            <strong className="customer-order-item-price">
                                ₹{item.subtotal}
                            </strong>

                        </div>
                    ))}

                </div>

                <div className="customer-order-total">

                    <span>
                        Total
                    </span>

                    <strong>
                        ₹{cart.total}
                    </strong>

                </div>

            </section>


            {/* Delivery Address */}
            <section className="customer-order-section">

                <span className="eyebrow">
                    DELIVERY ADDRESS
                </span>

                <div className="customer-order-address">

                    <p>
                        {address.address_line1}
                    </p>

                    {address.address_line2 && (
                        <p>
                            {address.address_line2}
                        </p>
                    )}

                    <p>
                        {address.city}, {address.state} -{" "}
                        {address.pincode}
                    </p>

                </div>

            </section>

                    {/* Payment Method */}

<section className="customer-order-section">

    <span className="eyebrow">
        PAYMENT METHOD
    </span>

    <div className="payment-options">

        <label
            className={`payment-option ${
                paymentMethod === "cod"
                    ? "selected"
                    : ""
            }`}
        >
            <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(event) =>
                    setPaymentMethod(event.target.value)
                }
            />

            <div className="payment-option-content">

                <strong>
                    Cash on Delivery
                </strong>

                <span>
                    Pay when your order arrives
                </span>

            </div>

        </label>


        <label
            className={`payment-option ${
                paymentMethod === "upi"
                    ? "selected"
                    : ""
            }`}
        >
            <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={paymentMethod === "upi"}
                onChange={(event) =>
                    setPaymentMethod(event.target.value)
                }
            />

            <div className="payment-option-content">

                <strong>
                    UPI
                </strong>

                <span>
                    Pay using your UPI app
                </span>

            </div>

        </label>


        <label
            className={`payment-option ${
                paymentMethod === "card"
                    ? "selected"
                    : ""
            }`}
        >
            <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(event) =>
                    setPaymentMethod(event.target.value)
                }
            />

            <div className="payment-option-content">

                <strong>
                    Credit / Debit Card
                </strong>

                <span>
                    Pay securely using your card
                </span>

            </div>

        </label>


        <label
            className={`payment-option ${
                paymentMethod === "net_banking"
                    ? "selected"
                    : ""
            }`}
        >
            <input
                type="radio"
                name="paymentMethod"
                value="net_banking"
                checked={paymentMethod === "net_banking"}
                onChange={(event) =>
                    setPaymentMethod(event.target.value)
                }
            />

            <div className="payment-option-content">

                <strong>
                    Net Banking
                </strong>

                <span>
                    Pay using your bank account
                </span>

            </div>

        </label>

    </div>

</section>
        <div className="customer-order-actions">

    <button
        type="button"
        className="customer-order-edit-btn"
        onClick={() => navigate(-1)}
    >
        Edit Cart
    </button>

    <button
        type="button"
        className="customer-order-place-btn"
        onClick={() => {
            setOrderError("");
            setShowOrderConfirmation(true);
        }}
    >
        Place Order
    </button>

</div>

{showOrderConfirmation && (
    <div className="order-confirmation-overlay">

        <div className="order-confirmation-popup">

            <div className="order-confirmation-header">

                <h2>
                    Confirm Your Order
                </h2>

                <button
                    type="button"
                    className="order-confirmation-close"
                    onClick={() =>
                        setShowOrderConfirmation(false)
                    }
                    disabled={placingOrder}
                >
                    ×
                </button>

            </div>


            <div className="order-confirmation-details">

                <div className="confirmation-row">

                    <span>
                        Total
                    </span>

                    <strong>
                        ₹{cart.total}
                    </strong>

                </div>


                <div className="confirmation-row">

                    <span>
                        Payment Method
                    </span>

                    <strong>
                        {paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : paymentMethod === "upi"
                            ? "UPI"
                            : paymentMethod === "card"
                            ? "Credit / Debit Card"
                            : "Net Banking"}
                    </strong>

                </div>

            </div>


            {orderError && (
                <p className="order-confirmation-error">
                    {orderError}
                </p>
            )}


            <div className="order-confirmation-actions">

                <button
                    type="button"
                    className="order-confirmation-cancel-btn"
                    onClick={() =>
                        setShowOrderConfirmation(false)
                    }
                    disabled={placingOrder}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="order-confirmation-submit-btn"
                    onClick={confirmAndPlaceOrder}
                    disabled={placingOrder}
                >
                    {placingOrder
                        ? "Placing Order..."
                        : "Confirm Payment & Place Order"}
                </button>

            </div>

        </div>

    </div>
)}
        </div>
    );
}

export default CustomerOrderPage;