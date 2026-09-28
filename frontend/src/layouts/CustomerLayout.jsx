import { Outlet, useNavigate } from "react-router-dom";

function CustomerLayout() {
    const navigate = useNavigate();

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