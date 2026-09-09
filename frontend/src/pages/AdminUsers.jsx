import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { apiFetch } from "../api/client";


function AdminUsers() {

    const navigate = useNavigate();
    const { logout } = useAuth();

    const [users, setUsers] = useState({
        customers: [],
        shop_owners: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeTab, setActiveTab] =
        useState("customers");


    useEffect(() => {
        loadUsers();
    }, []);


    async function loadUsers() {

        try {

            setLoading(true);
            setError("");

            const data = await apiFetch(
                "/admin/users"
            );

            setUsers(data);

        } catch (error) {

            console.error(error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/admin/dashboard");
                return;
            }

            setError(
                error.message ||
                "Unable to load users"
            );

        } finally {

            setLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await logout();
        } finally {
            navigate("/login");
        }
    }

    const displayedUsers =
        activeTab === "customers"
            ? users.customers
            : users.shop_owners;


    return (
        <div className="admin-dashboard">

            {/* HEADER */}

            <header className="admin-navbar">

                <div className="admin-navbar-container">

                    <div className="admin-brand">
                        Foodly Admin
                    </div>


                    <nav className="admin-nav">

                        <button
                            onClick={() =>
                                navigate(
                                    "/admin/dashboard"
                                )
                            }
                        >
                            Shops
                        </button>



                    </nav>

                    <button
                        className="admin-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="admin-content">

                <section className="admin-welcome">

                    <span className="eyebrow">
                        USER MANAGEMENT
                    </span>

                    <h1>
                        Platform Users
                    </h1>

                    <p>
                        View customer and shop owner
                        accounts registered on Foodly.
                    </p>

                </section>


                {/* USER COUNTS */}

                <section className="admin-stats">

                    <div className="admin-stat-card">

                        <span>
                            Customers
                        </span>

                        <strong>
                            {users.customers.length}
                        </strong>

                    </div>


                    <div className="admin-stat-card">

                        <span>
                            Shop Owners
                        </span>

                        <strong>
                            {users.shop_owners.length}
                        </strong>

                    </div>

                    <div className="admin-stat-card">

                        <span>
                            Total Users
                        </span>

                        <strong>
                            {
                                users.customers.length +
                                users.shop_owners.length
                            }
                        </strong>

                    </div>

                </section>


                {/* TABS */}

                <section className="admin-users-section">

                    <div className="user-tabs">

                        <button
                            className={
                                activeTab === "customers"
                                    ? "user-tab active"
                                    : "user-tab"
                            }
                            onClick={() =>
                                setActiveTab(
                                    "customers"
                                )
                            }
                        >
                            Customers
                            <span>
                                {users.customers.length}
                            </span>
                        </button>


                        <button
                            className={
                                activeTab === "shop_owners"
                                    ? "user-tab active"
                                    : "user-tab"
                            }
                            onClick={() =>
                                setActiveTab(
                                    "shop_owners"
                                )
                            }
                        >
                            Shop Owners
                            <span>
                                {users.shop_owners.length}
                            </span>
                        </button>

                    </div>


                    {loading && (
                        <p className="status-text">
                            Loading users...
                        </p>
                    )}


                    {error && (
                        <p className="error-text">
                            {error}
                        </p>
                    )}


                    {!loading &&
                        !error &&
                        displayedUsers.length === 0 && (

                            <div className="empty-state">

                                <h3>
                                    No users found
                                </h3>

                                <p>
                                    There are no users in
                                    this category.
                                </p>

                            </div>
                        )}


                    {!loading &&
                        !error &&
                        displayedUsers.length > 0 && (

                            <div className="users-table">

                                <div className="users-table-header">

                                    <span>
                                        User
                                    </span>

                                    <span>
                                        Email
                                    </span>

                                    <span>
                                        Status
                                    </span>

                                    <span>
                                        Role
                                    </span>

                                </div>


                                {displayedUsers.map(user => (

                                    <div
                                        className="users-table-row"
                                        key={user.user_id}
                                    >

                                        <div className="user-info">

                                            <div className="user-avatar">
                                                {user.user_name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <strong>
                                                    {user.user_name}
                                                </strong>

                                                <small>
                                                    #{user.user_id}
                                                </small>
                                            </div>

                                        </div>


                                        <span className="user-email">
                                            {user.user_email}
                                        </span>


                                        <span
                                            className={
                                                user.is_active
                                                    ? "status-approved"
                                                    : "status-pending"
                                            }
                                        >
                                            {user.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>


                                        <span className="role-badge">
                                            {user.role ===
                                                "shop_owner"
                                                ? "Shop Owner"
                                                : "Customer"}
                                        </span>

                                    </div>

                                ))}

                            </div>
                        )}

                </section>

            </main>

        </div>
    );
}


export default AdminUsers;