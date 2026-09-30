import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function CustomerLayout() {
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

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
                console.error(
                    "Failed to load notification count:",
                    error
                );
            }
        };

        loadUnreadCount();
    }, []);

    const handleNavigate = (path) => {
        navigate(path);
        setMenuOpen(false);
    };

    const handleLogout = async () => {
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
            setMenuOpen(false);
            navigate("/login");
        }
    };

    return (
        <div className="customer-dashboard">
            <header className="customer-navbar">
                <div className="customer-navbar-container">

                    {/* LOGO */}
                    <span
                        className="logo"
                        onClick={() =>
                            handleNavigate("/customer/dashboard")
                        }
                    >
                        Foodly

                        <img
                            src="/logo1.png"
                            alt="Foodly"
                            className="logo-icon"
                        />
                    </span>

                    {/* DESKTOP NAVIGATION */}
                    <nav className="customer-nav-links">

                        <button
                            onClick={() =>
                                handleNavigate("/customer/dashboard")
                            }
                        >
                            Home
                        </button>

                        <button
                            className="customer-orders-nav-btn"
                            onClick={() =>
                                handleNavigate("/customer/orders")
                            }
                        >
                            <span>Orders</span>
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate("/customer/cart")
                            }
                        >
                            Cart 🛒
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate("/customer/profile")
                            }
                        >
                            Profile
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate("/customer/notifications")
                            }
                            className="notification-bell-button"
                        >
                            <span className="notification-bell">
                                🔔
                            </span>

                            {unreadCount > 0 && (
                                <span className="notification-badge">
                                    {unreadCount > 99
                                        ? "99+"
                                        : unreadCount}
                                </span>
                            )}
                        </button>

                    </nav>

                    {/* DESKTOP LOGOUT */}
                    <button
                        className="customer-logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                    {/* MOBILE MENU BUTTON */}
                    <button
                        className="customer-menu-toggle"
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                </div>

                {/* MOBILE DROPDOWN */}
                {menuOpen && (
                    <div className="customer-mobile-menu">

                        <button
                            onClick={() =>
                                handleNavigate(
                                    "/customer/dashboard"
                                )
                            }
                        >
                             Home
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate(
                                    "/customer/orders"
                                )
                            }
                        >
                             Orders
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate(
                                    "/customer/cart"
                                )
                            }
                        >
                            🛒 Cart
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate(
                                    "/customer/profile"
                                )
                            }
                        >
                            👤 Profile
                        </button>

                        <button
                            onClick={() =>
                                handleNavigate(
                                    "/customer/notifications"
                                )
                            }
                        >
                            🔔 Notifications

                            {unreadCount > 0 && (
                                <span className="mobile-notification-badge">
                                    {unreadCount > 99
                                        ? "99+"
                                        : unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            className="mobile-logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>

                    </div>
                )}

            </header>

            <Outlet />
        </div>
    );
}

export default CustomerLayout;