import {
    useState
} from "react";

import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

function Login() {

    const navigate = useNavigate();

    const location = useLocation();

    const {
        loadUser
    } = useAuth();


    const [form, setForm] = useState({
        user_name: "",
        password: ""
    });

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    function handleChange(event) {

        setForm({
            ...form,
            [event.target.name]:
                event.target.value
        });
    }


    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await apiFetch(
                "/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify(form)
                }
            );

            const user =
                await loadUser();

            const next =
                new URLSearchParams(
                    location.search
                ).get("next");

            if (next) {
                navigate(next);
                return;
            }

            if (!user) {
                throw new Error(
                    "Unable to verify login session"
                );
            }

            if (user.role === "customer") {

                navigate(
                    "/customer/dashboard"
                );

            } else if (
                user.role === "shop_owner"
            ) {

                navigate(
                    "/shop/dashboard"
                );

            } else if (
                user.role === "admin"
            ) {

                navigate(
                    "/admin/dashboard"
                );

            } else {

                throw new Error(
                    "Unknown user role"
                );
            }

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Login failed."
            );

        } finally {

            setLoading(false);
        }
    }


    return (
        <main className="auth-page">

            <div className="auth-card">

                <div className="auth-brand">

                    <Link
                        to="/"
                        className="logo"
                    >
                        Foodly
                    </Link>

                </div>

                <span className="eyebrow">
                    WELCOME BACK
                </span>

                <h1>
                    Login
                </h1>

                <p>
                    Sign in to continue
                    ordering your favourite food.
                </p>


                <form
                    onSubmit={handleSubmit}
                >

                    <label>
                        Username
                    </label>

                    <input
                        type="text"
                        name="user_name"
                        value={
                            form.user_name
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        name="password"
                        value={
                            form.password
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />


                    {error && (
                        <p className="error-text">
                            {error}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login"}
                    </button>
                            <p className="forgot-password-wrapper">
    <Link
        to="/forgot-password"
        className="forgot-password-link"
    >
        Forgot Password?
    </Link>
</p>
                </form>


                <p className="auth-footer">

                    Don't have an account?

                    <Link to="/register">
                        Create one
                    </Link>

                </p>

                <Link
                    to="/register/shop"
                    className="shop-link"
                >
                    List your shop and items →
                </Link>

            </div>

        </main>
    );
}

export default Login;