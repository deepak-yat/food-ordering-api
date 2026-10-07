import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/ShopKitchenMonitor.css";
import { useNavigate } from "react-router-dom";
function ShopKitchenMonitor() {
    const [monitor, setMonitor] = useState(null);
    const [validationOrders, setValidationOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const navigate = useNavigate();
    async function loadMonitor(showRefresh = false) {
        try {
            if (showRefresh) {
                setRefreshing(true);
            }

            const [monitorData, validationData] = await Promise.all([
                apiFetch("/shop/orders/kitchen/monitor"),
                apiFetch("/shop/orders/kitchen/validation"),
            ]);

            setMonitor(monitorData);
            setValidationOrders(validationData);
            setLastUpdated(new Date());
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load kitchen monitor");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadMonitor();

        const interval = setInterval(() => {
            loadMonitor();
        }, 5000);

        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
    }, []);


    function getPreparationDuration(startTime) {
    if (!startTime) {
        return "00:00";
    }

    const elapsed = Math.max(
        0,
        currentTime - new Date(startTime).getTime()
    );

    const totalSeconds = Math.floor(elapsed / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(
            minutes
        ).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
        )}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(
        seconds
    ).padStart(2, "0")}`;
    }


    async function handleValidate(orderId) {
        try {
            await apiFetch(
                `/shop/orders/${orderId}/validate-ready`,
                {
                    method: "PUT",
                }
            );

            await loadMonitor();
        } catch (err) {
            console.error(err);
            alert("Failed to validate order");
        }
    }

    function formatLastUpdated() {
        if (!lastUpdated) {
            return "Updating...";
        }

        return lastUpdated.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function formatMinutes(minutes) {
        if (minutes == null) {
            return "—";
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }

        return `${remainingMinutes}m`;
    }

    function formatTime(dateString) {
        if (!dateString) {
            return "—";
        }

        return new Date(dateString).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function formatRelativeTime(dateString) {
        if (!dateString) {
            return "";
        }

        const diff = Math.max(
            0,
            Date.now() - new Date(dateString).getTime()
        );

        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `${hours}h ago`;
        }

        return `${hours}h ${remainingMinutes}m ago`;
    }

    if (loading) {
        return (
            <div className="shop-kitchen-monitor">
                <div className="kitchen-monitor-loading">
                    Loading Kitchen Monitor...
                </div>
            </div>
        );
    }

    const newCount = monitor?.new_count ?? 0;
    const preparingCount = monitor?.preparing_count ?? 0;
    const awaitingCount =
        monitor?.awaiting_validation_count ?? 0;

    return (
        <div className="shop-kitchen-monitor">

            {/* Header */}

            <div className="kitchen-monitor-page-header">
               <button
            type="button"
            className="kitchen-monitor-back-btn"
            onClick={() => navigate("/shop/dashboard")}
        >
            ← Dashboard
        </button>
                <div className="kitchen-monitor-title-area">

                    <div className="kitchen-monitor-icon">
                        👨‍🍳
                    </div>

                    <div>
                        <h1>Kitchen Monitor</h1>

                        <p>
                            Monitor kitchen progress and validate ready
                            orders
                        </p>
                    </div>

                </div>

                <div className="kitchen-monitor-header-actions">

                    <div className="kitchen-live-info">

                        <div className="live-status">
                            <span className="live-dot"></span>
                            <strong>Live updates</strong>
                        </div>

                        <span>
                            Last updated: {formatLastUpdated()}
                        </span>

                    </div>

                    <button
                        className="refresh-monitor-btn"
                        onClick={() => loadMonitor(true)}
                        disabled={refreshing}
                        title="Refresh"
                    >
                        {refreshing ? "↻" : "⟳"}
                    </button>

                </div>

            </div>

            {/* Stats */}

            <div className="kitchen-monitor-stat-grid">

                <div className="monitor-stat-card stat-new">

                    <div className="monitor-stat-icon">
                        📄
                    </div>

                    <div className="monitor-stat-content">

                        <span>New Orders</span>

                        <strong>{newCount}</strong>

                        <small>
                            Waiting for chef
                        </small>

                    </div>

                    <span className="stat-arrow">›</span>

                </div>

                <div className="monitor-stat-card stat-preparing">

                    <div className="monitor-stat-icon">
                        👨‍🍳
                    </div>

                    <div className="monitor-stat-content">

                        <span>Preparing</span>

                        <strong>{preparingCount}</strong>

                        <small>
                            Currently being prepared
                        </small>

                    </div>

                </div>

                <div className="monitor-stat-card stat-validation">

                    <div className="monitor-stat-icon">
                        🕐
                    </div>

                    <div className="monitor-stat-content">

                        <span>Awaiting Validation</span>

                        <strong>{awaitingCount}</strong>

                        <small>
                            Ready for your check
                        </small>

                    </div>

                </div>

            </div>

            {/* Alert + Longest Active */}

            <div className="kitchen-monitor-highlight-grid">

                <div className="validation-alert-card">

                    <div className="validation-alert-icon">
                        !
                    </div>

                    <div className="validation-alert-content">

                        <h2>
                            {awaitingCount}{" "}
                            {awaitingCount === 1
                                ? "order"
                                : "orders"}{" "}
                            awaiting validation
                        </h2>

                        <p>
                            These orders are kitchen ready and waiting
                            for your approval.
                        </p>

                    </div>

                    <button
                        className="view-orders-btn"
                        onClick={() => {
                            document
                                .querySelector(
                                    ".validation-orders-section"
                                )
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                });
                        }}
                    >
                        View Orders
                        <span>→</span>
                    </button>

                </div>

                <div className="longest-active-card">

                    <div className="longest-active-icon">
                        ⌛
                    </div>

                    <div className="longest-active-label">
                        <span>Longest Active Order</span>

                        <strong>
                            {monitor?.longest_active_order_id
                                ? `#${monitor.longest_active_order_id}`
                                : "—"}
                        </strong>
                    </div>

                    <div className="longest-active-time">

                        <strong>
                            {formatMinutes(
                                monitor?.longest_active_minutes
                            )}
                        </strong>

                        <span>
                            Active for{" "}
                            {monitor?.longest_active_minutes ?? 0}{" "}
                            minutes
                        </span>

                    </div>

                    <span className="longest-arrow">›</span>

                </div>

            </div>



                            <section className="currently-preparing-section">

    <div className="currently-preparing-header">

        <div>
            <div className="currently-preparing-title">
                <div className="currently-preparing-icon">
                    👨‍🍳
                </div>

                <div>
                    <h2>Currently Preparing</h2>

                    <p>
                        Orders currently being prepared by the kitchen
                    </p>
                </div>
            </div>
        </div>

        <span className="preparing-count-badge">
            {preparingCount}
        </span>

    </div>

    {monitor?.preparing_orders?.length === 0 ? (

        <div className="no-preparing-orders">
            <div className="no-preparing-icon">
                ✓
            </div>

            <div>
                <h3>No orders currently being prepared</h3>

                <p>
                    New kitchen activity will appear here automatically.
                </p>
            </div>
        </div>

    ) : (

        <div className="currently-preparing-list">

            {monitor.preparing_orders.map((order) => (

                <div
                    className="currently-preparing-card"
                    key={order.order_id}
                >

                    <div className="preparing-order-info">

                        <span className="preparing-order-label">
                            ORDER
                        </span>

                        <strong>
                            #{order.order_id}
                        </strong>

                    </div>

                    <div className="preparing-chef-info">

                        <div className="preparing-chef-avatar">
                            {order.assigned_kitchen_staff_name
                                ?.charAt(0)
                                ?.toUpperCase() || "C"}
                        </div>

                        <div>
                            <span>Chef</span>

                            <strong>
                                {order.assigned_kitchen_staff_name ||
                                    "Kitchen Staff"}
                            </strong>
                        </div>

                    </div>

                    <div className="preparing-start-info">

                        <span>
                            Started
                        </span>

                        <strong>
                            {formatTime(
                                order.preparation_started_at
                            )}
                        </strong>

                    </div>

                    <div className="preparing-timer">

                        <span>
                            Preparation Time
                        </span>

                        <strong>
                            {getPreparationDuration(
                                order.preparation_started_at
                            )}
                        </strong>

                    </div>

                    <div className="preparing-status">
                        <span className="preparing-live-dot"></span>

                        Preparing
                    </div>

                </div>

            ))}

        </div>

    )}

</section>



            {/* Validation Orders */}

            <section className="validation-orders-section">

                <div className="validation-section-header">

                    <div className="validation-section-title">

                        <div className="validation-section-icon">
                            🕐
                        </div>

                        <div>
                            <div className="validation-title-row">

                                <h2>
                                    Orders Awaiting Validation
                                </h2>

                                <span className="validation-count-badge">
                                    {awaitingCount}
                                </span>

                            </div>

                            <p>
                                These orders are prepared by the kitchen
                                and ready for your final check.
                            </p>
                        </div>

                    </div>

                    <div className="validation-sort">

                        <label>
                            Sort by:
                        </label>

                        <select defaultValue="oldest">
                            <option value="oldest">
                                Kitchen Ready (Oldest First)
                            </option>

                            <option value="newest">
                                Kitchen Ready (Newest First)
                            </option>
                        </select>

                    </div>

                </div>

                {validationOrders.length === 0 ? (

                    <div className="empty-validation-state">

                        <div className="empty-validation-icon">
                            ✓
                        </div>

                        <h3>
                            No orders awaiting validation
                        </h3>

                        <p>
                            Kitchen-ready orders will appear here.
                        </p>

                    </div>

                ) : (

                    <div className="validation-order-list">

                        {validationOrders.map((order) => (

                            <div
                                className="validation-order-card"
                                key={order.order_id}
                            >

                                {/* Order */}

                                <div className="validation-column order-column">

                                    <div className="order-heading-row">

                                        <h3>
                                            Order #{order.order_id}
                                        </h3>

                                        <span className="kitchen-ready-badge">
                                            <span>◷</span>
                                            Kitchen Ready
                                        </span>

                                    </div>

                                    <div className="order-date">

                                        <span>▣</span>

                                        <div>
                                            <span>
                                                {formatTime(
                                                    order.created_at
                                                )}
                                            </span>

                                            <small>
                                                {formatRelativeTime(
                                                    order.created_at
                                                )}
                                            </small>
                                        </div>

                                    </div>

                                </div>

                                {/* Customer */}

                                <div className="validation-column customer-column">

                                    <div className="column-label-icon">
                                        ♙
                                    </div>

                                    <div>

                                        <strong>
                                            {order.customer_name}
                                        </strong>

                                        {order.customer_phone && (
                                            <span>
                                                {order.customer_phone}
                                            </span>
                                        )}

                                    </div>

                                </div>

                                {/* Items */}

                                <div className="validation-column items-column">

                                    <div className="column-label">

                                        <span>
                                            🛍
                                        </span>

                                        <strong>
                                            {order.items?.reduce(
                                                (total, item) =>
                                                    total +
                                                    item.quantity,
                                                0
                                            ) ?? 0}{" "}
                                            items
                                        </strong>

                                    </div>

                                    <div className="order-items-list">

                                        {order.items?.map((item) => (

                                            <span
                                                key={
                                                    item.order_item_id
                                                }
                                            >
                                                {item.quantity} ×{" "}
                                                {item.item_name}
                                            </span>

                                        ))}

                                    </div>

                                </div>

                                {/* Chef */}

                                <div className="validation-column chef-column">

                                    <div className="chef-header">

                                        <span className="chef-icon">
                                            👨‍🍳
                                        </span>

                                        <span>
                                            Prepared by
                                        </span>

                                    </div>

                                    <div className="chef-info">

                                        <div className="chef-avatar">
                                            {order.assigned_kitchen_staff_name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "C"}
                                        </div>

                                        <div>

                                            <strong>
                                                {order.assigned_kitchen_staff_name ||
                                                    "Kitchen Staff"}
                                            </strong>

                                            <span>
                                                Kitchen ready at{" "}
                                                {formatTime(
                                                    order.kitchen_ready_at
                                                )}
                                            </span>

                                            <small>
                                                {formatRelativeTime(
                                                    order.kitchen_ready_at
                                                )}
                                            </small>

                                        </div>

                                    </div>

                                </div>

                                {/* Action */}

                                <div className="validation-column action-column">

                                    <button
                                        className="validate-ready-btn"
                                        onClick={() =>
                                            handleValidate(
                                                order.order_id
                                            )
                                        }
                                    >
                                        <span>✓</span>
                                        Validate & Mark Ready
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </section>

        </div>
    );
}

export default ShopKitchenMonitor;