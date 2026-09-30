import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
function CustomerLayout() {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
    const loadUnreadCount = async () => {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/customer/notifications/unread-count",
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch unread count");
            }

            const data = await response.json();
            setUnreadCount(data.count);
        } catch (error) {
            console.error("Failed to load notification count:", error);
        }
    };

    loadUnreadCount();
}, []);
    return (
        <div className="customer-dashboard">
            <header className="customer-navbar">
                <div className="customer-navbar-container">

                    <span
                        className="logo"
                        onClick={() =>
                            navigate("/customer/dashboard")
                        }
                    >
                        Foodly

                        <img
                            src="/logo1.png"
                            alt="Foodly"
                            className="logo-icon"
                        />
                    </span>

                    <nav className="customer-nav-links">
 <button onClick={() => navigate("/customer/dashboard")}>
    Home
</button>
                        <button
                            className="customer-orders-nav-btn"
                            onClick={() =>
                                navigate("/customer/orders")
                            }
                        >
                            <span>Orders</span>
                        </button>

                        <button
                            onClick={() =>
                                navigate("/customer/cart")
                            }
                        >
                            Cart 🛒
                        </button>

                       <button onClick={() => navigate("/customer/profile")}>
    Profile
</button>
<button
    onClick={() => navigate("/customer/notifications")}
    className="notification-bell-button"
>
    <span className="notification-bell">
        🔔
    </span>

    {unreadCount > 0 && (
        <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
        </span>
    )}
</button>

                    </nav>

                    <button
                        className="customer-logout-button"
                        onClick={async () => {
                            try {
                                await fetch(
                                    "http://127.0.0.1:8000/auth/logout",
                                    {
                                        method: "POST",
                                        credentials: "include",
                                    }
                                );
                            } catch (error) {
                                console.error(error);
                            } finally {
                                navigate("/login");
                            }
                        }}
                    >
                        Logout
                    </button>

                </div>
            </header>

            <Outlet />
        </div>
    );
}

export default CustomerLayout;