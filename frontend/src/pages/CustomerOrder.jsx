import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CustomerOrders() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const ordersPerPage = 5;

    const totalPages = Math.ceil(
    orders.length / ordersPerPage
    );

    const startIndex =
    (currentPage - 1) * ordersPerPage;

    const visibleOrders = orders.slice(
    startIndex,
    startIndex + ordersPerPage
    );
    useEffect(() => {
        loadOrders();
    }, []);
    useEffect(() => {
        setCurrentPage(1);
    },[orders]);

    async function loadOrders() {

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/customer/orders",
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

            console.error("Failed to load orders:", error);
            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    


    if (loading) {
        return (
            <div className="customer-orders-page">
                <p className="customer-orders-status">
                    Loading your orders...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-orders-page">
                <p className="customer-orders-error">
                    {error}
                </p>
            </div>
        );
    }

    

    return (
        <div className="customer-orders-page">

            <div className="customer-orders-header">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>
                <span className="eyebrow">
                    MY ORDERS
                </span>

                <h1>
                    Your Orders
                </h1>
            </div>

            {orders.length === 0 ? (

                <div className="customer-orders-empty">
                    <h2>
                        No orders yet
                    </h2>

                    <p>
                        Your orders will appear here once you place one.
                    </p>

                    <button
                        className="customer-orders-browse-btn"
                        onClick={() =>
                            navigate("/customer/dashboard")
                        }
                    >
                        Browse Restaurants
                    </button>
                </div>

            ) : (

                <div className="customer-orders-list">

                    {visibleOrders.map((order) => (

                        <div
                            key={order.order_id}
                            className="customer-order-card"
                            onClick={() =>
                                navigate(`/customer/orders/${order.order_id}/details`)
                            }
                        >

                            <div className="customer-order-card-top">

                                <div>
                                    <span className="order-card-label">
                                        <h1 >{order.shop_name}</h1>
                                    </span>

                                    <h3>
                                        #{order.order_id}
                                    </h3>
                                </div>

                                <span
                                    className={`order-status-badge ${order.status}`}
                                >
                                    {order.status}
                                </span>

                            </div>


                            <div className="customer-order-card-info">

                                <div>
                                    <span>
                                        Items
                                    </span>

                                    <strong>
                                        {order.items.length}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        ₹{order.total_amount}
                                    </strong>
                                </div>

                            </div>


                            <div className="customer-order-card-bottom">

                                <span>
                                    {new Date(
                                        order.created_at
                                    ).toLocaleDateString()}
                                </span>

                                <span className="view-order-link">
                                    View Order →
                                </span>

                            </div>

                        </div>

                    ))}

                </div>
                

            )}
            {totalPages > 1 && (
    <div className="order-pagination">

        <button
            className="order-pagination-button"
            disabled={currentPage === 1}
            onClick={() =>
                setCurrentPage(currentPage - 1)
            }
        >
            ‹
        </button>

        {Array.from(
            { length: totalPages },
            (_, index) => index + 1
        ).map((page) => (
            <button
                key={page}
                className={`order-pagination-button ${
                    currentPage === page
                        ? "active"
                        : ""
                }`}
                onClick={() =>
                    setCurrentPage(page)
                }
            >
                {page}
            </button>
        ))}

        <button
            className="order-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() =>
                setCurrentPage(currentPage + 1)
            }
        >
            ›
        </button>

    </div>
)}

        </div>
    );
}

export default CustomerOrders;