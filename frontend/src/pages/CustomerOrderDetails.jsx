import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function CustomerOrderDetails() {

    const navigate = useNavigate();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    async function loadOrder() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/customer/orders/${orderId}`,
                {
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load order"
                );
            }

            setOrder(data);

        } catch (error) {
            console.error("Failed to load order:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="customer-order-details-page">
                <p className="customer-orders-status">
                    Loading order...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-order-details-page">

                <button
                    className="customer-order-details-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <p className="customer-orders-error">
                    {error}
                </p>

            </div>
        );
    }

    return (
        <div className="customer-order-details-page">

            {/* Header */}

            <div className="customer-order-details-header">

                <button
                    className="customer-order-details-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <div>
                    <span className="eyebrow">
                              <h1 >{order.shop_name}</h1>  
                    </span>

                    <h1>
                        #{order.order_id}
                    </h1>
                </div>

                <span
                    className={`customer-order-details-status ${order.status.toLowerCase()}`}
                >
                    {order.status}
                </span>

            </div>


            {/* Items */}

            <section className="customer-order-details-section">

                <span className="eyebrow">
                    ORDER ITEMS
                </span>

                <div className="customer-order-details-items">

                    {order.items.map((item) => (

                        <div
                            key={item.order_item_id}
                            className="customer-order-details-item"
                        >

                            <div>
                                <strong>
                                    {item.item_name}
                                </strong>

                                <span>
                                    ₹{item.unit_price} × {item.quantity}
                                </span>
                            </div>

                            <strong>
                                ₹{item.subtotal}
                            </strong>

                        </div>

                    ))}

                </div>

                <div className="customer-order-details-total">

                    <span>
                        Total
                    </span>

                    <strong>
                        ₹{order.total_amount}
                    </strong>

                </div>

            </section>


            {/* Delivery Address */}

            <section className="customer-order-details-section">

                <span className="eyebrow">
                    DELIVERY ADDRESS
                </span>

                <div className="customer-order-details-address">

                    <p>
                        {order.delivery_address.address_line1}
                    </p>

                    {order.delivery_address.address_line2 && (
                        <p>
                            {order.delivery_address.address_line2}
                        </p>
                    )}

                    <p>
                        {order.delivery_address.city},{" "}
                        {order.delivery_address.state} -{" "}
                        {order.delivery_address.pincode}
                    </p>

                </div>

            </section>


            {/* Delivery Instructions */}

            {order.delivery_instruction && (
                <section className="customer-order-details-section">

                    <span className="eyebrow">
                        DELIVERY INSTRUCTION
                    </span>

                    <p className="customer-order-details-instruction">
                        {order.delivery_instruction}
                    </p>

                </section>
            )}


            {/* Contact Shop */}

            <section className="customer-order-details-shop">

                <div>
                    <span className="eyebrow">
                        NEED HELP?
                    </span>

                    <p>
                        Have an issue with this order?
                    </p>
                </div>

                <button
                    className="customer-order-contact-shop-btn"
                    onClick={() => {
                        // We'll connect this to the shop contact
                        // information next.
                    }}
                >
                    Contact Shop
                </button>

            </section>

        </div>
    );
}

export default CustomerOrderDetails;