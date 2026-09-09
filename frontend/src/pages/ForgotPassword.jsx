import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/auth/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_email: email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Something went wrong"
                );
            }

            setMessage(data.message);

        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="forgot-password-page">

            <div className="forgot-password-card">

                <button
                    className="forgot-password-back"
                    onClick={() => navigate("/login")}
                >
                    ← Back to Login
                </button>

                <div className="eyebrow">
                    PASSWORD RECOVERY
                </div>

                <h1>
                    Forgot your password?
                </h1>

                <p>
                    Enter your email address and we'll
                    send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="forgot-password-form-group">

                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />

                    </div>

                    {message && (
                        <p className="forgot-password-success">
                            {message}
                        </p>
                    )}

                    {error && (
                        <p className="forgot-password-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="primary-button forgot-password-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "Send Reset Link"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default ForgotPassword;