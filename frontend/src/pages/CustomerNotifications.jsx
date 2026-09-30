import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import "../styles/CustomerNotifications.css";

function CustomerNotifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);
    const [orderDetailCache, setOrderDetailCache] = useState({});
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState("");
    const [filterCounts, setFilterCounts] = useState({
        ALL: 0,
        ORDER_STATUS: 0,
        OFFER: 0,
        SYSTEM: 0,
    });
    useEffect(() => {
    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch(
                `/customer/notifications?page=${currentPage}&page_size=10`
            );

            console.log("Notifications:", data);

            setNotifications(data.items || []);
            setTotalPages(data.total_pages || 0);

            setFilterCounts(data.counts || {
                ALL: 0,
                ORDER_STATUS: 0,
                OFFER: 0,
                SYSTEM: 0,
            });
        } catch (err) {
            console.error("Failed to load notifications:", err);
            setError("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    loadNotifications();
}, [currentPage]);
    const markAllAsRead = async () => {
        try {
            await apiFetch("/customer/notifications/read-all", {
                method: "PATCH",
            });

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );
        } catch (err) {
            console.error("Failed to mark notifications as read:", err);
        }
    };
    const filteredNotifications = notifications.filter((notification) => {
        if (activeFilter === "ALL") return true;

        return notification.notification_type === activeFilter;
    });
    useEffect(() => {
        if (filteredNotifications.length === 0) {
            setSelectedNotificationId(null);
            return;
        }

        const selectedStillExists = filteredNotifications.some(
            (notification) =>
                notification.notification_id === selectedNotificationId
        );

        if (!selectedStillExists) {
            setSelectedNotificationId(
                filteredNotifications[0].notification_id
            );
        }
    }, [notifications, activeFilter, selectedNotificationId]);
    const selectedNotification = filteredNotifications.find(
        (notification) =>
            notification.notification_id === selectedNotificationId
    );
    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;

    const formatTime = (iso) => {
        const date = new Date(iso);
        const now = new Date();

        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const isYesterday =
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();

        const time = date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        if (isToday) {
            return `Today, ${time}`;
        }

        if (isYesterday) {
            return `Yesterday, ${time}`;
        }

        return date.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };
    if (loading) {
        return (
            <main className="customer-notifications-page">
                <div className="notifications-container">
                    <div className="notifications-loading">
                        Loading notifications...
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="customer-notifications-page">
                <div className="notifications-container">
                    <div className="notifications-error">
                        {error}
                    </div>
                </div>
            </main>
        );
    }


    const handleNotificationClick = async (notification) => {
        setSelectedNotificationId(notification.notification_id);

        if (!notification.is_read) {
            try {
                await apiFetch(
                    `/customer/notifications/${notification.notification_id}/read`,
                    {
                        method: "PATCH",
                    }
                );

                setNotifications((prev) =>
                    prev.map((item) =>
                        item.notification_id === notification.notification_id
                            ? { ...item, is_read: true }
                            : item
                    )
                );
            } catch (err) {
                console.error("Failed to mark notification as read:", err);
            }
        }

        if (notification.order_id) {
            loadOrderDetails(notification.order_id);
        }
    };

    const loadOrderDetails = async (orderId) => {
        if (!orderId || orderDetailCache[orderId]) {
            return;
        }

        try {
            setOrderDetailLoading(true);
            setOrderDetailError("");

            const data = await apiFetch(`/customer/orders/${orderId}`);

            setOrderDetailCache((prev) => ({
                ...prev,
                [orderId]: data,
            }));
        } catch (err) {
            console.error("Failed to load order details:", err);
            setOrderDetailError("Failed to load order details.");
        } finally {
            setOrderDetailLoading(false);
        }
    };

    return (
        <main className="customer-notifications-page">
            <div className="notifications-container">

                <div className="notifications-header">
                    <div>
                        <h1>Notifications</h1>

                        <p>
                            Stay updated with your Foodly orders and offers.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            className="mark-all-btn"
                            onClick={markAllAsRead}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="notification-filters">
                    {[
                        { label: "All", value: "ALL" },
                        { label: "Order Updates", value: "ORDER_STATUS" },
                        { label: "Offers", value: "OFFER" },
                        { label: "System", value: "SYSTEM" },
                    ].map((filter) => (
                        <button
                            key={filter.value}
                            className={
                                activeFilter === filter.value
                                    ? "notification-filter active"
                                    : "notification-filter"
                            }
                            onClick={() => setActiveFilter(filter.value)}
                        >
                            {filter.label}

                            <span className="filter-count">
                                {filterCounts[filter.value]}
                            </span>
                        </button>
                    ))}
                </div>

                {filteredNotifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="notifications-empty-icon">
                            🔔
                        </div>

                        <h2>No notifications</h2>

                        <p>
                            You're all caught up. New updates will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="notifications-content">
                        <div className="notifications-list">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={
                                        notification.notification_id === selectedNotificationId
                                            ? "notification-card selected"
                                            : notification.is_read
                                                ? "notification-card"
                                                : "notification-card unread"
                                    }
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-shop-image">
                                        {notification.shop_image_url ? (
                                            <img
                                                src={`http://127.0.0.1:8000${notification.shop_image_url}`}
                                                alt={notification.shop_name || "Shop"}
                                            />
                                        ) : (
                                            <span>
                                                {notification.shop_name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "F"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="notification-content">
                                        <div className="notification-title-row">
                                            <h3>{notification.title}</h3>

                                            {!notification.is_read && (
                                                <span className="unread-dot" />
                                            )}
                                        </div>

                                        <p>{notification.message}</p>

                                        <div className="notification-meta">
                                            <span>
                                                {notification.shop_name}
                                            </span>

                                            <span>•</span>

                                            <span>
                                                {formatTime(
                                                    notification.created_at
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="notification-arrow">
                                        →
                                    </div>
                                </div>
                            ))}
                             {totalPages > 1 && (
                            <div className="notifications-pagination">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                >
                                    ← Previous
                                </button>

                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                        </div>
                       
                        {selectedNotification && (
                            <div className="notification-detail-panel">

                                <div className="notification-detail-image">
                                    {selectedNotification.shop_image_url ? (
                                        <img
                                            src={`http://127.0.0.1:8000${selectedNotification.shop_image_url}`}
                                            alt={
                                                selectedNotification.shop_name || "Shop"
                                            }
                                        />
                                    ) : (
                                        <span>
                                            {selectedNotification.shop_name
                                                ?.charAt(0)
                                                .toUpperCase() || "F"}
                                        </span>
                                    )}
                                </div>

                                <div className="notification-detail-body">

                                    <span className="notification-type-badge">
                                        {selectedNotification.notification_type ===
                                            "ORDER_STATUS"
                                            ? "Order Update"
                                            : selectedNotification.notification_type}
                                    </span>

                                    <h2>{selectedNotification.title}</h2>

                                    <div className="notification-detail-time">
                                        {formatTime(
                                            selectedNotification.created_at
                                        )}
                                    </div>

                                    <p>
                                        {selectedNotification.message}
                                    </p>

                                    {selectedNotification.order_id && (
                                        <button
                                            className="view-order-btn"
                                            onClick={() =>
                                                navigate(
                                                    `/customer/orders/${selectedNotification.order_id}/details`
                                                )
                                            }
                                        >
                                            View Order #{selectedNotification.order_id}
                                        </button>

                                    )}
                                    {selectedNotification.order_id && (
                                        <div className="notification-order-section">
                                            <div className="notification-section-header">
                                                <h3>Order Details</h3>
                                            </div>

                                            <div className="notification-order-placeholder">
                                                {(() => {
                                                    const order = orderDetailCache[selectedNotification.order_id];
                                                    const status = order?.status;

                                                    const statusProgress = {
                                                        pending: 0,
                                                        accepted: 1,
                                                        preparing: 2,
                                                        ready: 3,
                                                        completed: 4,
                                                    };
                                                    if (orderDetailLoading) {
                                                        return (
                                                            <div className="notification-order-placeholder">
                                                                <span>Loading order details...</span>
                                                            </div>
                                                        );
                                                    }

                                                    if (orderDetailError) {
                                                        return (
                                                            <div className="notification-order-placeholder">
                                                                <span>{orderDetailError}</span>
                                                            </div>
                                                        );
                                                    }

                                                    if (!order) {
                                                        return (
                                                            <div className="notification-order-placeholder">
                                                                <span>Order details are not available.</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <div className="notification-order-details">
                                                                <div className="order-detail-shop">
                                                                    <span>Shop</span>
                                                                    <strong>{order.shop_name}</strong>
                                                                </div>

                                                                <div className="order-detail-items">
                                                                    {order.items?.map((item, index) => (
                                                                        <div className="order-detail-item" key={index}>
                                                                            <div>
                                                                                <strong>{item.item_name}</strong>
                                                                                <span>
                                                                                    {item.quantity} × ₹{item.unit_price}
                                                                                </span>
                                                                            </div>

                                                                            <strong>₹{item.subtotal}</strong>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="order-detail-total">
                                                                    <span>Total Amount</span>
                                                                    <strong>₹{order.total_amount}</strong>
                                                                </div>
                                                            </div>
                                                            <div className="notification-timeline-section">
                                                                <div className="notification-section-header">
                                                                    <h3>Order Timeline</h3>
                                                                </div>

                                                                {status === "rejected" ? (
                                                                    <div className="order-timeline">
                                                                        <div className="timeline-step completed">
                                                                            <div className="timeline-dot" />
                                                                            <div className="timeline-content">
                                                                                <strong>Order Placed</strong>
                                                                                <span>Order #{selectedNotification.order_id}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="timeline-step cancelled">
                                                                            <div className="timeline-dot" />
                                                                            <div className="timeline-content">
                                                                                <strong>Order Cancelled</strong>
                                                                                <span>The shop could not accept your order.</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="order-timeline">
                                                                        {[
                                                                            {
                                                                                label: "Order Placed",
                                                                                description: `Order #${selectedNotification.order_id}`,
                                                                            },
                                                                            {
                                                                                label: "Order Confirmed",
                                                                                description: "Your order has been confirmed by the shop.",
                                                                            },
                                                                            {
                                                                                label: "Being Prepared",
                                                                                description: "Your order is being prepared.",
                                                                            },
                                                                            {
                                                                                label: "Order Ready",
                                                                                description: "Your order is ready.",
                                                                            },
                                                                            {
                                                                                label: "Delivered",
                                                                                description: "Your order has been completed.",
                                                                            },
                                                                        ].map((step, index) => (
                                                                            <div
                                                                                key={step.label}
                                                                                className={`timeline-step ${index <= statusProgress[status]
                                                                                        ? "completed"
                                                                                        : ""
                                                                                    }`}
                                                                            >
                                                                                <div className="timeline-dot" />

                                                                                <div className="timeline-content">
                                                                                    <strong>{step.label}</strong>
                                                                                    <span>{step.description}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                </div>

                            </div>
                        )}

                    </div>
                )}
            </div>
        </main>
    );
}

export default CustomerNotifications;