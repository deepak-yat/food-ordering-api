import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {

    const { logout } = useAuth();
    const navigate = useNavigate();

    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedShop, setSelectedShop] = useState(null);
    const [shopDetailsLoading, setShopDetailsLoading] = useState(false);
    const [deleteShop, setDeleteShop] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        loadShops();
    }, []);

    async function loadShops() {

        try {
            setLoading(true);

            const data = await apiFetch(
                "/admin/shops"
            );
            setShops(data);
        } catch (error) {
            console.error(error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/");
                return;
            }

            setError(
                error.message ||
                "Unable to load shops"
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

    async function viewShop(shopId) {
        try {
            setShopDetailsLoading(true);
            setError("");
            const data = await apiFetch(
                `/admin/shops/${shopId}`
            );
            setSelectedShop(data);
        } catch (error) {
            console.error(error);
            if (error.status === 401) {
                navigate("/login");
                return;
            }
            if (error.status === 403) {
                navigate("/");
                return;
            }

            setError(
                error.message ||
                "Unable to load shop details"
            );
        } finally {
            setShopDetailsLoading(false);
        }
    }

    async function approveShop(shopId) {
        try {
            const data = await apiFetch(
                `/admin/shops/${shopId}/approve`,
                {
                    method: "PUT"
                }
            );
            console.log(data);

            setShops(currentShops =>
                currentShops.map(shop =>
                    shop.shop_id = shopId
                        ? {
                            ...shop,
                            is_approved: true,
                            is_active: true
                        }
                        : shop
                )
            );
        } catch (error) {
            console.error(error);
            if (error.status === 401) {
                navigate("/login");
                return;
            }
            if (error.status === 403) {
                navigate("/");
                return;
            }
            setError(
                error.message ||
                "Unable to approve shop"
            );
        }
    }

    async function confirmDeleteShop() {

        if (!deleteShop) {
            return;
        }

        try {

            setDeleteLoading(true);

            await apiFetch(
                `/admin/shops/${deleteShop.shop_id}`,
                {
                    method: "DELETE"
                }
            );

            setShops(currentShops =>
                currentShops.filter(
                    shop =>
                        shop.shop_id !==
                        deleteShop.shop_id
                )
            );

            setDeleteShop(null);

        } catch (error) {

            console.error(error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/");
                return;
            }

            setError(
                error.message ||
                "Unable to delete shop"
            );

        } finally {

            setDeleteLoading(false);
        }
    }


    return (
        <div className="admin-dashboard">

            <header className="admin-navbar">

                <div className="admin-navbar-container">

                    <div className="admin-brand">
                        Foodly Admin
                    </div>

                    <nav className="admin-nav">


                        <button
                            onClick={() =>
                                navigate("/admin/users")
                            }
                        >
                            Users
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
                        ADMINISTRATION
                    </span>

                    <h1>
                        Manage your platform
                    </h1>

                    <p>
                        Review shops, approve new partners
                        and manage existing shops.
                    </p>

                </section>


                <section className="admin-stats">

                    <div className="admin-stat-card">

                        <span>
                            Total Shops
                        </span>

                        <strong>
                            {shops.length}
                        </strong>

                    </div>

                    <div className="admin-stat-card">

                        <span>
                            Pending
                        </span>

                        <strong>
                            {
                                shops.filter(
                                    shop =>
                                        !shop.is_approved
                                ).length
                            }
                        </strong>

                    </div>

                    <div className="admin-stat-card">

                        <span>
                            Active
                        </span>

                        <strong>
                            {
                                shops.filter(
                                    shop =>
                                        shop.is_active &&
                                        shop.is_approved
                                ).length
                            }
                        </strong>

                    </div>

                </section>


                <section className="admin-shops">

                    <div className="section-heading">

                        <span className="eyebrow">
                            SHOP MANAGEMENT
                        </span>

                        <h2>
                            Shops
                        </h2>

                        <p>
                            View and manage all registered shops.
                        </p>

                    </div>


                    {loading && (
                        <p className="status-text">
                            Loading shops...
                        </p>
                    )}


                    {error && (
                        <p className="error-text">
                            {error}
                        </p>
                    )}


                    {!loading &&
                        !error &&
                        shops.length === 0 && (
                            <div className="empty-state">
                                <h3>
                                    No shops found
                                </h3>

                                <p>
                                    There are currently no
                                    registered shops.
                                </p>
                            </div>
                        )
                    }


                    <div className="admin-shop-grid">

                        {shops.map(shop => (

                            <article
                                className="admin-shop-card"
                                key={shop.shop_id}
                            >

                                <div className="admin-shop-card-top">

                                    <div className="shop-image-small">
                                        {shop.shop_name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <span
                                        className={
                                            shop.is_approved
                                                ? "status-approved"
                                                : "status-pending"
                                        }
                                    >
                                        {
                                            shop.is_approved
                                                ? "Approved"
                                                : "Pending"
                                        }
                                    </span>

                                </div>


                                <h3>
                                    {shop.shop_name}
                                </h3>

                                <p>
                                    {shop.description ||
                                        "No description available."}
                                </p>


                                <div className="admin-shop-meta">

                                    <span>
                                        Shop ID
                                    </span>

                                    <strong>
                                        #{shop.shop_id}
                                    </strong>

                                </div>


                                <div className="admin-shop-actions">

                                    <button
                                        className="admin-delete-button"
                                        onClick={() => viewShop(shop.shop_id)}
                                    >
                                        View
                                    </button>

                                    {!shop.is_approved && (
                                        <button
                                            className="primary-button"
                                            onClick={() =>
                                                approveShop(shop.shop_id)
                                            }
                                        >
                                            Approve
                                        </button>
                                    )}

                                    <button
                                        className="admin-delete-button"
                                        onClick={() => setDeleteShop(shop)}
                                    >
                                        Delete
                                    </button>

                                </div>

                            </article>

                        ))}

                    </div>

                </section>

                {selectedShop && (
                    <div
                        className="admin-modal-overlay"
                        onClick={() => setSelectedShop(null)}
                    >

                        <div
                            className="admin-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="admin-modal-header">

                                <div>
                                    <span className="eyebrow">
                                        SHOP DETAILS
                                    </span>

                                    <h2>
                                        {selectedShop.shop_name}
                                    </h2>
                                </div>

                                <button
                                    className="admin-modal-close"
                                    onClick={() =>
                                        setSelectedShop(null)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            {shopDetailsLoading ? (

                                <p className="status-text">
                                    Loading shop details...
                                </p>

                            ) : (

                                <div className="admin-details">

                                    <div className="admin-detail-row">
                                        <span>
                                            Shop ID
                                        </span>

                                        <strong>
                                            #{selectedShop.shop_id}
                                        </strong>
                                    </div>


                                    <div className="admin-detail-row">
                                        <span>
                                            Description
                                        </span>

                                        <strong>
                                            {
                                                selectedShop.description ||
                                                "No description"
                                            }
                                        </strong>
                                    </div>


                                    <div className="admin-detail-row">
                                        <span>
                                            Owner User ID
                                        </span>

                                        <strong>
                                            #{selectedShop.owner_user_id}
                                        </strong>
                                    </div>


                                    <div className="admin-detail-row">
                                        <span>
                                            Approval
                                        </span>

                                        <strong>
                                            {selectedShop.is_approved
                                                ? "Approved"
                                                : "Pending"}
                                        </strong>
                                    </div>


                                    <div className="admin-detail-row">
                                        <span>
                                            Shop Status
                                        </span>

                                        <strong>
                                            {selectedShop.is_active
                                                ? "Active"
                                                : "Inactive"}
                                        </strong>
                                    </div>

                                </div>

                            )}

                        </div>

                    </div>
                )}

                {deleteShop && (
                    <div
                        className="admin-confirm-overlay"
                        onClick={() => {
                            if (!deleteLoading) {
                                setDeleteShop(null);
                            }
                        }}
                    >

                        <div
                            className="admin-confirm-modal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="confirm-icon">
                                !
                            </div>

                            <span className="eyebrow">
                                DELETE SHOP
                            </span>

                            <h2>
                                Delete {deleteShop.shop_name}?
                            </h2>

                            <p>
                                This action will permanently delete
                                this shop. Make sure you really want
                                to continue.
                            </p>

                            <div className="admin-confirm-actions">

                                <button
                                    className="secondary-button"
                                    disabled={deleteLoading}
                                    onClick={() =>
                                        setDeleteShop(null)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="admin-delete-confirm"
                                    disabled={deleteLoading}
                                    onClick={confirmDeleteShop}
                                >
                                    {deleteLoading
                                        ? "Deleting..."
                                        : "Yes, Delete Shop"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </main>

        </div>
    );

}

export default AdminDashboard;