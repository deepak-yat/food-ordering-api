import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "../api/client";


function ShopRegister() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        user_name: "",
        user_email: "",
        password: "",
        confirm_password: "",
        shop_name: "",
        description: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);


    function handleChange(event) {

        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    }


    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setSuccess("");

        if (
            form.password !==
            form.confirm_password
        ) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {

            const shopData = {
                user_name: form.user_name,
                user_email: form.user_email,
                password: form.password,
                shop_name: form.shop_name,
                description: form.description || null
            };

            await apiFetch(
                "/auth/register/shop",
                {
                    method: "POST",
                    body: JSON.stringify(shopData)
                }
            );

            setSuccess(
                "Your shop registration has been submitted. Please wait for admin approval."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1800);

        } catch (error) {

            console.error(error);

            setError(
                error.message ||
                "Unable to submit shop registration."
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
                        Grow your food business with Foodly.
                    </p>

                </div>


                <div className="auth-card">

                    <div className="auth-heading">

                        <span className="eyebrow">
                            PARTNER WITH FOODLY
                        </span>

                        <h1>
                            List your shop
                        </h1>

                        <p>
                            Create your shop account and
                            submit it for admin approval.
                        </p>

                    </div>


                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >

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


                        <div className="form-group">

                            <label htmlFor="shop_name">
                                Shop Name
                            </label>

                            <input
                                id="shop_name"
                                name="shop_name"
                                type="text"
                                placeholder="Enter your shop name"
                                value={form.shop_name}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label htmlFor="description">
                                Shop Description
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                placeholder="Tell customers about your shop..."
                                value={form.description}
                                onChange={handleChange}
                                rows="4"
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
                                ? "Submitting..."
                                : "Submit Shop Registration"}
                        </button>

                    </form>


                    <p className="auth-footer">

                        Already have an account?

                        <Link to="/login">
                            Login
                        </Link>

                    </p>


                    <Link
                        to="/register"
                        className="shop-link"
                    >
                        Looking to order food?
                        <strong>
                            Create customer account →
                        </strong>
                    </Link>

                </div>

            </div>

        </main>
    );
}


export default ShopRegister;