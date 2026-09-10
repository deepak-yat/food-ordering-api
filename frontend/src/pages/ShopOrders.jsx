import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ShopOrders() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/shop/orders",
                {
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load orders"
                );
            }

            setOrders(data);

        } catch (error) {
            console.error("Failed to load shop orders:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(orderId, newStatus) {

        setUpdatingOrderId(orderId);
        setError("");

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/shop/orders/${orderId}/status`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to update order"
                );
            }

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order.order_id === orderId
                        ? {
                            ...order,
                            status: data.status,
                        }
                        : order
                )
            );

        } catch (error) {
            console.error(
                "Failed to update order status:",
                error
            );

            setError(error.message);

        } finally {
            setUpdatingOrderId(null);
        }
    }

    function getNextAction(order) {

        switch (order.status.toLowerCase()) {

            case "pending":
                return (
                    <>
                        <button
                            className="shop-order-reject-btn"
                            disabled={
                                updatingOrderId === order.order_id
                            }
                            onClick={() =>
                                updateOrderStatus(
                                    order.order_id,
                                    "rejected"
                                )
                            }
                        >
                            Reject
                        </button>

                        <button
                            className="shop-order-primary-btn"
                            disabled={
                                updatingOrderId === order.order_id
                            }
                            onClick={() =>
                                updateOrderStatus(
                                    order.order_id,
                                    "accepted"
                                )
                            }
                        >
                            Accept Order
                        </button>
                    </>
                );

            case "accepted":
                return (
                    <button
                        className="shop-order-primary-btn"
                        disabled={
                            updatingOrderId === order.order_id
                        }
                        onClick={() =>
                            updateOrderStatus(
                                order.order_id,
                                "preparing"
                            )
                        }
                    >
                        Start Preparing
                    </button>
                );

            case "preparing":
                return (
                    <button
                        className="shop-order-primary-btn"
                        disabled={
                            updatingOrderId === order.order_id
                        }
                        onClick={() =>
                            updateOrderStatus(
                                order.order_id,
                                "ready"
                            )
                        }
                    >
                        Mark Ready
                    </button>
                );

            case "ready":
                return (
                    <button
                        className="shop-order-primary-btn"
                        disabled={
                            updatingOrderId === order.order_id
                        }
                        onClick={() =>
                            updateOrderStatus(
                                order.order_id,
                                "completed"
                            )
                        }
                    >
                        Complete Order
                    </button>
                );

            default:
                return null;
        }
    }

    if (loading) {
        return (
            <div className="shop-orders-page">
                <p className="shop-orders-status">
                    Loading orders...
                </p>
            </div>
        );
    }

    return (
        <div className="shop-orders-page">

            <div className="shop-orders-header">

                <div>
                    <span className="eyebrow">
                        LIVE ORDERS
                    </span>

                    <h1>
                        Incoming Orders
                    </h1>
                </div>

                <button
                    className="shop-orders-back-btn"
                    onClick={() =>
                        navigate("/shop/dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>

            {error && (
                <p className="shop-orders-error">
                    {error}
                </p>
            )}

            {orders.length === 0 ? (

                <div className="shop-orders-empty">
                    <h2>
                        No orders yet
                    </h2>

                    <p>
                        New customer orders will appear here.
                    </p>

                </div>

            ) : (

                <div className="shop-orders-list">

                    {orders.map((order) => (

                        <div
                            key={order.order_id}
                            className="shop-live-order-card"
                        >

                            {/* Header */}

                            <div className="shop-live-order-header">

                                <div>
                                    <span className="shop-order-label">
                                        ORDER
                                    </span>

                                    <h2>
                                        #{order.order_id}
                                    </h2>
                                </div>

                                <span
                                    className={`shop-order-status ${order.status.toLowerCase()}`}
                                >
                                    {order.status}
                                </span>

                            </div>


                            {/* Customer */}

                            <div className="shop-order-customer">

                                <span className="shop-order-section-title">
                                    CUSTOMER
                                </span>

                                <strong>
                                    {order.customer_name}
                                </strong>

                                {order.customer_phone && (
                                    <span>
                                        {order.customer_phone}
                                    </span>
                                )}

                            </div>


                            {/* Address */}

                            {order.delivery_address && (
                                <div className="shop-order-address">

                                    <span className="shop-order-section-title">
                                        DELIVERY ADDRESS
                                    </span>

                                    <p>
                                        {
                                            order.delivery_address
                                                .address_line1
                                        }
                                    </p>

                                    {order.delivery_address
                                        .address_line2 && (
                                            <p>
                                                {
                                                    order
                                                        .delivery_address
                                                        .address_line2
                                                }
                                            </p>
                                        )}

                                    <p>
                                        {
                                            order.delivery_address.city
                                        }
                                        ,{" "}
                                        {
                                            order.delivery_address.state
                                        }{" "}
                                        -{" "}
                                        {
                                            order.delivery_address.pincode
                                        }
                                    </p>

                                </div>
                            )}


                            {/* Instructions */}

                            {order.delivery_instruction && (
                                <div className="shop-order-instruction">

                                    <span className="shop-order-section-title">
                                        DELIVERY INSTRUCTION
                                    </span>

                                    <p>
                                        {order.delivery_instruction}
                                    </p>

                                </div>
                            )}


                            {/* Items */}

                            <div className="shop-live-order-items">

                                <span className="shop-order-section-title">
                                    ITEMS
                                </span>

                                {order.items.map((item) => (

                                    <div
                                        key={item.order_item_id}
                                        className="shop-live-order-item"
                                    >

                                        <div>
                                            <strong>
                                                {item.item_name}
                                            </strong>

                                            <span>
                                                × {item.quantity}
                                            </span>
                                        </div>

                                        <strong>
                                            ₹{item.subtotal}
                                        </strong>

                                    </div>

                                ))}

                            </div>


                            {/* Total */}

                            <div className="shop-live-order-total">

                                <span>
                                    Total
                                </span>

                                <strong>
                                    ₹{order.total_amount}
                                </strong>

                            </div>


                            {/* Actions */}

                            <div className="shop-live-order-actions">

                                {updatingOrderId ===
                                    order.order_id && (
                                        <span className="shop-order-updating">
                                            Updating...
                                        </span>
                                    )}

                                <div className="shop-live-order-action-buttons">
                                    {getNextAction(order)}
                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default ShopOrders;