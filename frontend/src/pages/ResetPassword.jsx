import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        setSuccess("");
        setError("");

        if (!token) {
            setError(
                "This password reset link is invalid."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token,
                        new_password: newPassword,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to reset password"
                );
            }

            setSuccess(
                "Your password has been reset successfully."
            );

            setNewPassword("");
            setConfirmPassword("");

        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="reset-password-page">

            <div className="reset-password-card">

                <span className="eyebrow">
                    PASSWORD RECOVERY
                </span>

                <h1>
                    Reset Password
                </h1>

                <p>
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="reset-password-form-group">

                        <label htmlFor="new-password">
                            New Password
                        </label>

                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>

                    <div className="reset-password-form-group">

                        <label htmlFor="confirm-password">
                            Confirm Password
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            required
                        />

                    </div>

                    {error && (
                        <p className="reset-password-error">
                            {error}
                        </p>
                    )}

                    {success && (
                        <div className="reset-password-success">

                            <p>
                                {success}
                            </p>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    navigate("/login")
                                }
                            >
                                Go to Login
                            </button>

                        </div>
                    )}

                    {!success && (
                        <button
                            type="submit"
                            className="primary-button reset-password-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Resetting..."
                                : "Reset Password"}
                        </button>
                    )}

                </form>

            </div>

        </div>
    );
}

export default ResetPassword;