import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/KitchenDashboard.css";
import { useNavigate } from "react-router-dom";
function KitchenDashboard() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await apiFetch("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            navigate("/login");
        }
    };
    const [orders, setOrders] = useState({
        new: [],
        preparing: [],
        ready: [],
        completed: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOrders();

        const interval = setInterval(() => {
            loadOrders();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    async function loadOrders() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/kitchen/orders");

            setOrders({
                new: data.new || [],
                preparing: data.preparing || [],
                ready: data.ready || [],
                completed: data.completed || [],
            });
        } catch (error) {
            console.error("Kitchen orders error:", error);

            setError(
                error.message || "Unable to load kitchen orders."
            );
        } finally {
            setLoading(false);
        }
    }

    // Select an accepted order and start preparing it
    const handleSelectOrder = async (order) => {
        try {
            setError("");

            await apiFetch(
                `/shop/orders/${order.order_id}/start-preparing`,
                {
                    method: "PUT",
                }
            );

            // Refresh all queues after successful assignment
            await loadOrders();
        } catch (error) {
            console.error("Failed to select order:", error);

            setError(
                error.message || "Unable to select order."
            );
        }
    };
    const handleKitchenReady = async (order) => {
        try {
            setError("");

            await apiFetch(
                `/shop/orders/${order.order_id}/kitchen-ready`,
                {
                    method: "PUT",
                }
            );

            await loadOrders();
        } catch (error) {
            console.error(
                "Failed to mark order as kitchen-ready:",
                error
            );

            setError(
                error.message || "Unable to mark order as kitchen-ready."
            );
        }
    };
    function KitchenOrderCard({ order, onSelect, onKitchenReady }) {
        const itemCount = order.items.reduce(
            (total, item) => total + item.quantity,
            0
        );

        const isNewOrder = order.status === "accepted";
        const isPreparingOrder =
            order.status === "preparing" &&
            !order.kitchen_ready_at;
        return (
            <article className="kitchen-order-card">

                {/* Order Header */}
                <div className="kitchen-order-card-top">
                    <strong>
                        Order #{order.order_id}
                    </strong>

                    <span>
                        {itemCount} item
                        {itemCount !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Customer */}
                <div className="kitchen-order-customer">
                    <strong>
                        {order.customer_name || "Customer"}
                    </strong>
                </div>

                {/* Items */}
                <div className="kitchen-order-items">
                    {order.items.map((item) => (
                        <div
                            key={item.order_item_id}
                            className="kitchen-order-item"
                        >
                            <span>
                                {item.item_name}
                            </span>

                            <strong>
                                × {item.quantity}
                            </strong>
                        </div>
                    ))}
                </div>

                {/* Assigned Chef */}
                {order.assigned_kitchen_staff_name && (
                    <div className="kitchen-order-chef">
                        👨‍🍳{" "}
                        <span>
                            {order.assigned_kitchen_staff_name}
                        </span>
                    </div>
                )}

                {/* Select Order Button */}
                {isNewOrder && onSelect && (
                    <button
                        type="button"
                        className="kitchen-select-order-button"
                        onClick={() => onSelect(order)}
                    >
                        Start preperation
                    </button>
                )}
                {isPreparingOrder && (
                    <button
                        type="button"
                        className="kitchen-ready-button"
                        onClick={() => onKitchenReady(order)}
                    >
                        Mark Kitchen Ready
                    </button>
                )}

            </article>
        );
    }

    return (
        <div className="kitchen-dashboard">

            {/* HEADER */}
            <header className="kitchen-header">

                <div>
                    <h1>Kitchen Dashboard</h1>

                    <p>
                        Manage and prepare incoming orders
                    </p>
                </div>

                <div className="kitchen-header-actions">

                    <div className="kitchen-staff-info">
                        <div className="kitchen-staff-avatar">
                            👨‍🍳
                        </div>

                        <div>
                            <strong>Kitchen Staff</strong>
                            <span>Online</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="kitchen-logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="kitchen-content">

                {/* QUEUE SUMMARY */}
                <div className="kitchen-queue-summary">

                    <div className="kitchen-queue-summary-card">
                        <span>New</span>
                        <strong>
                            {orders.new.length}
                        </strong>
                    </div>

                    <div className="kitchen-queue-summary-card">
                        <span>Preparing</span>
                        <strong>
                            {orders.preparing.length}
                        </strong>
                    </div>

                    <div className="kitchen-queue-summary-card">
                        <span>Ready</span>
                        <strong>
                            {orders.ready.length}
                        </strong>
                    </div>

                    <div className="kitchen-queue-summary-card">
                        <span>Completed</span>
                        <strong>
                            {orders.completed.length}
                        </strong>
                    </div>

                </div>


                {/* LOADING */}
                {loading && (
                    <div className="kitchen-loading">
                        Loading kitchen orders...
                    </div>
                )}


                {/* ERROR */}
                {!loading && error && (
                    <div className="kitchen-error">
                        {error}
                    </div>
                )}


                {/* KANBAN */}
                {!loading && !error && (
                    <div className="kitchen-kanban">


                        {/* ================= NEW ================= */}
                        <section className="kitchen-column">

                            <div className="kitchen-column-header">

                                <div>
                                    <h2>New</h2>

                                    <span>
                                        Waiting for chef
                                    </span>
                                </div>

                                <strong>
                                    {orders.new.length}
                                </strong>

                            </div>


                            <div className="kitchen-order-list">

                                {orders.new.length === 0 ? (
                                    <div className="kitchen-empty">
                                        No new orders
                                    </div>
                                ) : (
                                    orders.new.map((order) => (
                                        <KitchenOrderCard
                                            key={order.order_id}
                                            order={order}
                                            onSelect={handleSelectOrder}
                                        />
                                    ))
                                )}

                            </div>

                        </section>


                        {/* ================= PREPARING ================= */}
                        <section className="kitchen-column">

                            <div className="kitchen-column-header">

                                <div>
                                    <h2>Preparing</h2>

                                    <span>
                                        Currently being prepared
                                    </span>
                                </div>

                                <strong>
                                    {orders.preparing.length}
                                </strong>

                            </div>


                            <div className="kitchen-order-list">

                                {orders.preparing.length === 0 ? (
                                    <div className="kitchen-empty">
                                        No orders being prepared
                                    </div>
                                ) : (
                                    orders.preparing.map((order) => (
                                        <KitchenOrderCard
                                            key={order.order_id}
                                            order={order}
                                            onKitchenReady={handleKitchenReady}
                                        />
                                    ))
                                )}

                            </div>

                        </section>


                        {/* ================= READY ================= */}
                        <section className="kitchen-column">

                            <div className="kitchen-column-header">

                                <div>
                                    <h2>Ready</h2>

                                    <span>
                                        Waiting for manager
                                    </span>
                                </div>

                                <strong>
                                    {orders.ready.length}
                                </strong>

                            </div>


                            <div className="kitchen-order-list">

                                {orders.ready.length === 0 ? (
                                    <div className="kitchen-empty">
                                        No ready orders
                                    </div>
                                ) : (
                                    orders.ready.map((order) => (
                                        <KitchenOrderCard
                                            key={order.order_id}
                                            order={order}
                                        />
                                    ))
                                )}

                            </div>

                        </section>


                        {/* ================= COMPLETED ================= */}
                        <section className="kitchen-column">

                            <div className="kitchen-column-header">

                                <div>
                                    <h2>Completed</h2>

                                    <span>
                                        Finished orders
                                    </span>
                                </div>

                                <strong>
                                    {orders.completed.length}
                                </strong>

                            </div>


                            <div className="kitchen-order-list">

                                {orders.completed.length === 0 ? (
                                    <div className="kitchen-empty">
                                        No completed orders
                                    </div>
                                ) : (
                                    orders.completed.map((order) => (
                                        <KitchenOrderCard
                                            key={order.order_id}
                                            order={order}
                                        />
                                    ))
                                )}

                            </div>

                        </section>

                    </div>
                )}

            </main>

        </div>
    );
}

export default KitchenDashboard;