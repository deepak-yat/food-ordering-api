import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function ProtectedRoute({ children, role }) {

    const {
        user,
        loading
    } = useAuth();

    const location = useLocation();


    // Wait until /auth/me finishes
    if (loading) {
        return (
            <div className="route-loading">
                <div className="loading-spinner"></div>

                <p>
                    Checking your session...
                </p>
            </div>
        );
    }


    // Not authenticated
    if (!user) {

        return (
            <Navigate
                to={`/login?next=${encodeURIComponent(
                    location.pathname
                )}`}
                replace
            />
        );
    }


    // Wrong role
    if (role && user.role !== role) {

        if (user.role === "customer") {
            return (
                <Navigate
                    to="/customer/dashboard"
                    replace
                />
            );
        }

        if (user.role === "shop_owner") {
            return (
                <Navigate
                    to="/shop/dashboard"
                    replace
                />
            );
        }

        if (user.role === "admin") {
            return (
                <Navigate
                    to="/admin/dashboard"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    return children;
}


export default ProtectedRoute;