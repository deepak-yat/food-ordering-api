import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../api/client";
import GoogleSignInButton from "../components/GoogleSignInButton";

function Register() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        user_name: "",
        user_email: "",
        password: "",
        confirm_password: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const [verificationStep, setVerificationStep] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    function handleChange(event) {

        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    }


    async function handleSubmit(event) {

        event.preventDefault();
        if (form.password !== form.confirm_password) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const registrationData = {
                user_name: form.user_name,
                user_email: form.user_email,
                password: form.password
            };

            await apiFetch(
                "/auth/register/start",
                {
                    method: "POST",
                    body: JSON.stringify(registrationData)
                }
            );

            setVerificationStep(true);
            setSuccess("Verification code sent to your email.");
            

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to create account."
            );

        } finally {

            setLoading(false);
        }
    }


    async function handleVerification() {
    setError("");
    setSuccess("");

    if (verificationCode.length !== 6) {
        setError("Please enter the 6-digit verification code.");
        return;
    }

    setLoading(true);

    try {
        await apiFetch(
            "/auth/register/verify",
            {
                method: "POST",
                body: JSON.stringify({
                    email: form.user_email,
                    verification_code: verificationCode
                })
            }
        );

        setSuccess("Email verified successfully. Account created!");

        setTimeout(() => {
            navigate("/login");
        }, 1200);

    } catch (error) {
        console.error(error);

        setError(
            error.message ||
            "Unable to verify email."
        );

    } finally {
        setLoading(false);
    }
}

    return (
        <main className="auth-page">

            <div className="auth-container">

                <div className="auth-brand">

                    <Link
                        to="/"
                        className="logo"
                    >
                        Foodly
                    </Link>

                    <p>
                        Good food. Simple ordering.
                    </p>

                </div>


                <div className="auth-card">

                    <div className="auth-heading">

                        <span className="eyebrow">
                            JOIN FOODLY
                        </span>

                        <h1>
                            Create account
                        </h1>

                        <p>
                            Create your customer account
                            and start ordering.
                        </p>

                    </div>


                    <form
    className="auth-form"
    onSubmit={handleSubmit}
>
    {verificationStep ? (
        <>
            <div className="auth-heading">
                <span className="eyebrow">
                    VERIFY EMAIL
                </span>

                <h1>
                    Verify your email
                </h1>
            <button
    type="button"
    className="secondary-button"
    onClick={handleResend}
    disabled={loading}
>
    Resend Code
</button>
                <p>
                    Enter the 6-digit verification code
                    sent to {form.user_email}.
                </p>
            </div>

            <div className="form-group">
                <label htmlFor="verification_code">
                    Verification Code
                </label>

                <input
                    id="verification_code"
                    name="verification_code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(event) =>
                        setVerificationCode(event.target.value)
                    }
                    maxLength={6}
                    required
                />
            </div>

            {error && (
                <p className="error-text">
                    {error}
                </p>
            )}

            {success && (
                <p className="success-text">
                    {success}
                </p>
            )}

            <button
    type="button"
    className="primary-button"
    disabled={loading}
    onClick={handleVerification}
>
    {loading ? "Verifying..." : "Verify Email"}
</button>
        </>
    ) : (
        <>
            <div className="form-group">

                <label htmlFor="user_name">
                    Username
                </label>

                <input
                    id="user_name"
                    name="user_name"
                    type="text"
                    placeholder="Choose a username"
                    value={form.user_name}
                    onChange={handleChange}
                    required
                />

            </div>


            <div className="form-group">

                <label htmlFor="user_email">
                    Email
                </label>

                <input
                    id="user_email"
                    name="user_email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.user_email}
                    onChange={handleChange}
                    required
                />

            </div>


            <div className="form-group">

                <label htmlFor="password">
                    Password
                </label>

                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />

            </div>


            <div className="form-group">

                <label htmlFor="confirm_password">
                    Confirm Password
                </label>

                <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm your password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    required
                />

            </div>


            {error && (
                <p className="error-text">
                    {error}
                </p>
            )}


            {success && (
                <p className="success-text">
                    {success}
                </p>
            )}


            <button
                type="submit"
                className="primary-button"
                disabled={loading}
            >
                {loading
                    ? "Sending code..."
                    : "Create Account"}
            </button>
        </>
    )}
</form>

                    <div className="google-signin-section">
    <div className="google-signin-divider">
        <span>OR</span>
    </div>

    <GoogleSignInButton />
</div>


                    <p className="auth-footer">

                        Already have an account?

                        <Link to="/login">
                            Login
                        </Link>

                    </p>


                    <Link
                        to="/register/shop"
                        className="shop-link"
                    >
                        Own a restaurant? 
                        <strong>
                            List your shop →
                        </strong>
                    </Link>

                </div>

            </div>

        </main>
    );
}

export default Register;