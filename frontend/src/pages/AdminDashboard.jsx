import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
function AdminDashboard() {

    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("overview");
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedShop, setSelectedShop] = useState(null);
    const [shopDetailsLoading, setShopDetailsLoading] = useState(false);
    const [deleteShop, setDeleteShop] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [currentShopPage, setCurrentShopPage] = useState(1);
    const [overview, setOverview] = useState(null);
const [overviewLoading, setOverviewLoading] = useState(true);
const [overviewError, setOverviewError] = useState("");
    const shopsPerPage = 6;

    const approvedShops = shops.filter(
    shop => shop.is_approved
        );
const [pendingShops, setPendingShops] = useState([]);
const [pendingLoading, setPendingLoading] = useState(false);
const [pendingError, setPendingError] = useState("");
    const totalShopPages = Math.ceil(
    approvedShops.length / shopsPerPage
    );
const [messageView, setMessageView] = useState("history");
    const startShopIndex =
    (currentShopPage - 1) * shopsPerPage;

    const visibleShops = approvedShops.slice(
    startShopIndex,
    startShopIndex + shopsPerPage
    );
    
    const [messageSubject, setMessageSubject] = useState("");
const [messageContent, setMessageContent] = useState("");
const [messageLoading, setMessageLoading] = useState(false);
const [messageError, setMessageError] = useState("");
const [messageSuccess, setMessageSuccess] = useState("");
const [messageAudience, setMessageAudience] = useState("all");
const [selectedShopIds, setSelectedShopIds] = useState([]);
const [adminMessages, setAdminMessages] = useState([]);
const [messageHistoryLoading, setMessageHistoryLoading] = useState(false);
const [messageHistoryError, setMessageHistoryError] = useState("");
const [messageHistoryPage, setMessageHistoryPage] = useState(1);

const messagesPerPage = 5;
const approvedMessageShops = shops.filter(
    shop => shop.is_approved
);

const totalMessagePages = Math.ceil(
    adminMessages.length / messagesPerPage
);
const [selectedAdminMessage, setSelectedAdminMessage] = useState(null);
const messageStartIndex =
    (messageHistoryPage - 1) * messagesPerPage;

const visibleAdminMessages = adminMessages.slice(
    messageStartIndex,
    messageStartIndex + messagesPerPage
);


    useEffect(() => {
        loadShops();
        loadOverview();
    }, []);
    useEffect(() => {
    setCurrentShopPage(1);
}, [shops]);
useEffect(() => {
    if (activeSection === "pending-shops") {
        loadPendingShops();
    }

    if (activeSection === "messages") {
        loadAdminMessages();
    }
}, [activeSection]);

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

    async function loadOverview() {
    try {
        setOverviewLoading(true);
        setOverviewError("");

        const data = await apiFetch(
            "/admin/overview"
        );

        setOverview(data);

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

        setOverviewError(
            error.message ||
            "Unable to load overview analytics"
        );

    } finally {
        setOverviewLoading(false);
    }
}

async function loadPendingShops() {
    try {
        setPendingLoading(true);
        setPendingError("");

        const data = await apiFetch(
            "/admin/pending-shops"
        );

        console.log("Pending shops:", data);

        setPendingShops(data);

    } catch (error) {
        console.error("Pending shops error:", error);

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setPendingError(
            error.message ||
            "Unable to load pending shops"
        );

    } finally {
        setPendingLoading(false);
    }
}
async function approvePendingShop(shopId) {
    try {

        await apiFetch(
            `/admin/shops/${shopId}/approve`,
            {
                method: "PUT"
            }
        );

        setPendingShops(currentShops =>
            currentShops.filter(
                shop => shop.shop_id !== shopId
            )
        );

        setShops(currentShops =>
            currentShops.map(shop =>
                shop.shop_id === shopId
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

        setPendingError(
            error.message ||
            "Unable to approve shop"
        );
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

    function toggleShopSelection(shopId) {
    setSelectedShopIds((currentIds) =>
        currentIds.includes(shopId)
            ? currentIds.filter(id => id !== shopId)
            : [...currentIds, shopId]
    );
}

   async function sendMessage(event) {
    event.preventDefault();

    setMessageError("");
    setMessageSuccess("");

    if (!messageSubject.trim()) {
        setMessageError("Subject is required.");
        return;
    }

    if (!messageContent.trim()) {
        setMessageError("Message content is required.");
        return;
    }

    if (
        messageAudience === "selected" &&
        selectedShopIds.length === 0
    ) {
        setMessageError(
            "Please select at least one shop."
        );
        return;
    }

    try {
        setMessageLoading(true);

        let data;

        if (messageAudience === "all") {

            data = await apiFetch(
                "/admin/messages/broadcast",
                {
                    method: "POST",
                    body: JSON.stringify({
                        subject: messageSubject.trim(),
                        content: messageContent.trim()
                    })
                }
            );

        } else {

            data = await apiFetch(
                "/admin/messages/send",
                {
                    method: "POST",
                    body: JSON.stringify({
                        subject: messageSubject.trim(),
                        content: messageContent.trim(),
                        shop_ids: selectedShopIds
                    })
                }
            );
        }

        setMessageSuccess(
            `Message sent successfully to ${data.recipient_count} shops.`
        );

        setMessageSubject("");
        setMessageContent("");
        setSelectedShopIds([]);
        setMessageAudience("all");

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

        setMessageError(
            error.message ||
            "Unable to send message."
        );

    } finally {
        setMessageLoading(false);
    }
}

function changeMessageView(view) {
    setMessageView(view);

    if (view === "history") {
        setMessageHistoryPage(1);
    }
}


async function loadAdminMessages() {
    try {
        setMessageHistoryLoading(true);
        setMessageHistoryError("");

        const data = await apiFetch("/admin/messages");

        setAdminMessages(data.Messages || []);
        setMessageHistoryPage(1);

    } catch (error) {
        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setMessageHistoryError(
            error.message || "Unable to load message history."
        );

    } finally {
        setMessageHistoryLoading(false);
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

                            <aside className="admin-sidebar">

    <div className="admin-sidebar-menu">

        <button
    className={`admin-sidebar-item ${
        activeSection === "overview" ? "active" : ""
    }`}
    onClick={() => setActiveSection("overview")}
>
    <span>Overview</span>
</button>

<button
    className={`admin-sidebar-item ${
        activeSection === "pending-shops" ? "active" : ""
    }`}
    onClick={() => setActiveSection("pending-shops")}
>
    <span>Pending Shops</span>
</button>

        <div className="admin-sidebar-item disabled">
            <span>Analytics</span>
            <small>Coming Soon</small>
        </div>

        <button
    className={`admin-sidebar-item ${
        activeSection === "messages" ? "active" : ""
    }`}
    onClick={() => setActiveSection("messages")}
>
    <span>Messages</span>
</button>

    </div>

</aside>

            <main className="admin-content">
 {activeSection === "overview" && (
        <>
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

    {visibleShops.map(shop => (

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
                    onClick={() =>
                        viewShop(shop.shop_id)
                    }
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
                    onClick={() =>
                        setDeleteShop(shop)
                    }
                >
                    Delete
                </button>

            </div>

        </article>

    ))}

</div>
{totalShopPages > 1 && (
    <div className="admin-shop-pagination">

        <button
            className="admin-shop-pagination-button"
            disabled={currentShopPage === 1}
            onClick={() =>
                setCurrentShopPage(
                    currentShopPage - 1
                )
            }
        >
            ‹
        </button>

        {Array.from(
            { length: totalShopPages },
            (_, index) => index + 1
        ).map(page => (
            <button
                key={page}
                className={`admin-shop-pagination-button ${
                    currentShopPage === page
                        ? "active"
                        : ""
                }`}
                onClick={() =>
                    setCurrentShopPage(page)
                }
            >
                {page}
            </button>
        ))}

        <button
            className="admin-shop-pagination-button"
            disabled={
                currentShopPage === totalShopPages
            }
            onClick={() =>
                setCurrentShopPage(
                    currentShopPage + 1
                )
            }
        >
            ›
        </button>

    </div>
)}

<section className="admin-business-overview">

    <div className="section-heading">

        <span className="eyebrow">
            BUSINESS ANALYTICS
        </span>

        <h2>
            Revenue Overview
        </h2>

        <p>
            Current month revenue and Foodly platform earnings.
        </p>

    </div>

    {overviewLoading && (
        <p className="status-text">
            Loading business analytics...
        </p>
    )}

    {overviewError && (
        <p className="error-text">
            {overviewError}
        </p>
    )}

    {!overviewLoading &&
        !overviewError &&
        overview && (

        <>

            <div className="admin-business-stats">

                <div className="admin-business-card">
                    <span>
                        Monthly Revenue
                    </span>

                    <strong>
                        ₹
                        {overview.monthly_business.total_shop_revenue.toLocaleString()}
                    </strong>

                    <small>
                        {overview.monthly_business.month}
                    </small>
                </div>


                <div className="admin-business-card">
                    <span>
                        Foodly Revenue
                    </span>

                    <strong>
                        ₹
                        {overview.monthly_business.foodly_fee.toLocaleString()}
                    </strong>

                    <small>
                        {overview.monthly_business.fee_rate}% platform fee
                    </small>
                </div>


                <div className="admin-business-card">
                    <span>
                        Shop Earnings
                    </span>

                    <strong>
                        ₹
                        {overview.monthly_business.shop_earnings.toLocaleString()}
                    </strong>

                    <small>
                        After Foodly fee
                    </small>
                </div>

            </div>
            <div className="admin-chart-card">

    <div className="admin-chart-header">
        <div>
            <span className="eyebrow">
                REVENUE
            </span>

            <h3>
                Last 7 Days
            </h3>
        </div>

        <span className="admin-chart-period">
            Completed orders
        </span>
    </div>

    <div className="admin-chart">
        <ResponsiveContainer
            width="100%"
            height={320}
        >
            <LineChart
                data={overview.daily_revenue}
            >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                    dataKey="date"
                />

                <YAxis />

                <Tooltip
                    formatter={(value) =>
                        `₹${Number(value).toLocaleString()}`
                    }
                />

                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="currentColor"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>

</div>
<div className="admin-chart-card">

    <div className="admin-chart-header">
        <div>
            <span className="eyebrow">
                SHOP PERFORMANCE
            </span>

            <h3>
                Top Shops by Revenue
            </h3>
        </div>
    </div>

    <div className="admin-chart">
        <ResponsiveContainer
            width="100%"
            height={350}
        >
            <BarChart
                data={overview.shop_performance.slice(0, 6)}
                layout="vertical"
                margin={{
                    left: 20,
                    right: 20
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                    type="number"
                />

                <YAxis
                    type="category"
                    dataKey="shop_name"
                    width={100}
                />

                <Tooltip
                    formatter={(value) =>
                        `₹${Number(value).toLocaleString()}`
                    }
                />

                <Bar
                    dataKey="revenue"
                    radius={[0, 6, 6, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    </div>

</div>

        </>
    )}

</section>

                </section>
                </>
    )}
{activeSection === "pending-shops" && (
        <>
           <section className="admin-welcome">

    <span className="eyebrow">
        SHOP APPROVALS
    </span>

    <h1>
        Pending Shops
    </h1>

    <p>
        Review and manage shops waiting for approval.
    </p>

</section>

<section className="admin-shops">

    <div className="section-heading">

        <span className="eyebrow">
            PENDING REQUESTS
        </span>

        <h2>
            Shop Requests
        </h2>

        <p>
            Approve or reject new shop registrations.
        </p>

    </div>

    {pendingLoading && (
        <p className="status-text">
            Loading pending shops...
        </p>
    )}

    {pendingError && (
        <p className="error-text">
            {pendingError}
        </p>
    )}

    {!pendingLoading &&
        !pendingError &&
        pendingShops.length === 0 && (
            <div className="empty-state">

                <h3>
                    No pending shops
                </h3>

                <p>
                    There are currently no shops waiting
                    for approval.
                </p>

            </div>
        )
    }

    {!pendingLoading &&
        !pendingError &&
        pendingShops.length > 0 && (

        <div className="admin-shop-grid">

            {pendingShops.map(shop => (

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

                        <span className="status-pending">
                            Pending
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
                            onClick={() =>
                                viewShop(shop.shop_id)
                            }
                        >
                            View
                        </button>

                        <button
                            className="primary-button"
                            onClick={() =>
                                approvePendingShop(
                                    shop.shop_id
                                )
                            }
                        >
                            Approve
                        </button>

                        <button
                            className="admin-delete-button"
                            onClick={() =>
                                rejectShop(shop.shop_id)
                            }
                        >
                            Reject
                        </button>

                    </div>

                </article>

            ))}

        </div>
    )}

</section>
        </>
    )}
   {activeSection === "messages" && (
    <>
        <section className="admin-welcome">

            <span className="eyebrow">
                COMMUNICATION
            </span>

            <h1>
                Messages
            </h1>

            <p>
                Manage announcements and communication
                with Foodly shop owners.
            </p>

        </section>


        <div className="admin-message-navigation">

            <button
                className={
                    messageView === "history"
                        ? "admin-message-nav-button active"
                        : "admin-message-nav-button"
                }
                onClick={() =>
                    changeMessageView("history")
                }
            >
                Message History
            </button>

            <button
                className={
                    messageView === "compose"
                        ? "admin-message-nav-button active"
                        : "admin-message-nav-button"
                }
                onClick={() =>
                    changeMessageView("compose")
                }
            >
                Send Message
            </button>

        </div>


        {/* ===================================== */}
        {/* MESSAGE HISTORY */}
        {/* ===================================== */}

        {messageView === "history" && (

            <section className="admin-message-history">

                <div className="section-heading">

                    <span className="eyebrow">
                        HISTORY
                    </span>

                    <h2>
                        Sent Messages
                    </h2>

                    <p>
                        Review messages previously sent
                        to shop owners.
                    </p>

                </div>


                {messageHistoryLoading && (
                    <p className="status-text">
                        Loading message history...
                    </p>
                )}


                {messageHistoryError && (
                    <p className="error-text">
                        {messageHistoryError}
                    </p>
                )}


                {!messageHistoryLoading &&
                    !messageHistoryError &&
                    adminMessages.length === 0 && (

                    <div className="empty-state">

                        <h3>
                            No messages sent yet
                        </h3>

                        <p>
                            Messages you send to shops
                            will appear here.
                        </p>

                    </div>
                )}


                {!messageHistoryLoading &&
                    !messageHistoryError &&
                    adminMessages.length > 0 && (
                    
                    <>

                        <div className="admin-message-history-list">

                            {visibleAdminMessages.map(message => (

                                <article
                                    key={message.message_id}
                                    className="admin-message-history-card"
                                >

                                    <div className="admin-message-history-header">

                                        <div>

                                            <h3>
                                                {message.subject}
                                            </h3>

                                            <span>
                                                {message.recipient_count}{" "}
                                                {message.recipient_count === 1
                                                    ? "recipient"
                                                    : "recipients"}
                                            </span>

                                        </div>


                                        <span className="admin-message-date">

                                            {new Date(
                                                message.created_at
                                            ).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                }
                                            )}

                                        </span>

                                    </div>


                                    <p>
                                        {message.content.length > 120
                                            ? `${message.content.slice(0, 120)}...`
                                            : message.content}
                                    </p>


                                    <button
                                        type="button"
                                        className="admin-message-view-button"
                                        onClick={() =>
                                            setSelectedAdminMessage(
                                                message
                                            )
                                        }
                                    >
                                        View Message →
                                    </button>

                                </article>

                            ))}

                        </div>


                        {totalMessagePages > 1 && (

                            <div className="admin-message-pagination">

                                <button
                                    disabled={
                                        messageHistoryPage === 1
                                    }
                                    onClick={() =>
                                        setMessageHistoryPage(
                                            currentPage =>
                                                currentPage - 1
                                        )
                                    }
                                >
                                    ‹
                                </button>


                                {Array.from(
                                    {
                                        length:
                                            totalMessagePages
                                    },
                                    (_, index) =>
                                        index + 1
                                ).map(page => (

                                    <button
                                        key={page}
                                        className={
                                            messageHistoryPage === page
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setMessageHistoryPage(
                                                page
                                            )
                                        }
                                    >
                                        {page}
                                    </button>

                                ))}


                                <button
                                    disabled={
                                        messageHistoryPage ===
                                        totalMessagePages
                                    }
                                    onClick={() =>
                                        setMessageHistoryPage(
                                            currentPage =>
                                                currentPage + 1
                                        )
                                    }
                                >
                                    ›
                                </button>

                            </div>

                        )}

                    </>
                )}

            </section>

        )}


        {/* ===================================== */}
        {/* COMPOSE MESSAGE */}
        {/* ===================================== */}

        {messageView === "compose" && (

            <section className="admin-message-section">

                <div className="section-heading">

                    <span className="eyebrow">
                        COMPOSE
                    </span>

                    <h2>
                        Send Message
                    </h2>

                    <p>
                        Send announcements and important
                        updates to Foodly shop owners.
                    </p>

                </div>


                <form
                    className="admin-message-form"
                    onSubmit={sendMessage}
                >

                    <div className="admin-message-recipient-section">

                        <span className="admin-message-recipient-label">
                            Recipients
                        </span>


                        <div className="admin-message-audience-options">

                            <label className="admin-message-radio">

                                <input
                                    type="radio"
                                    name="messageAudience"
                                    value="all"
                                    checked={
                                        messageAudience === "all"
                                    }
                                    onChange={() => {
                                        setMessageAudience("all");
                                        setSelectedShopIds([]);
                                    }}
                                    disabled={messageLoading}
                                />

                                <span>
                                    All Approved Shops
                                </span>

                            </label>


                            <label className="admin-message-radio">

                                <input
                                    type="radio"
                                    name="messageAudience"
                                    value="selected"
                                    checked={
                                        messageAudience === "selected"
                                    }
                                    onChange={() =>
                                        setMessageAudience("selected")
                                    }
                                    disabled={messageLoading}
                                />

                                <span>
                                    Selected Shops
                                </span>

                            </label>

                        </div>


                        {messageAudience === "selected" && (

                            <div className="admin-message-shop-selector">

                                <div className="admin-message-shop-selector-header">

                                    <strong>
                                        Select Shops
                                    </strong>

                                    <span>
                                        {selectedShopIds.length} selected
                                    </span>

                                </div>


                                <div className="admin-message-shop-list">

                                    {approvedMessageShops.map(
                                        shop => (

                                        <label
                                            key={shop.shop_id}
                                            className="admin-message-shop-option"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedShopIds.includes(
                                                        shop.shop_id
                                                    )
                                                }
                                                onChange={() =>
                                                    toggleShopSelection(
                                                        shop.shop_id
                                                    )
                                                }
                                                disabled={
                                                    messageLoading
                                                }
                                            />

                                            <span>
                                                {shop.shop_name}
                                            </span>

                                        </label>

                                    ))}

                                </div>

                            </div>
                        )}

                    </div>


                    <div className="admin-message-field">

                        <label htmlFor="message-subject">
                            Subject
                        </label>

                        <input
                            id="message-subject"
                            type="text"
                            value={messageSubject}
                            onChange={(event) =>
                                setMessageSubject(
                                    event.target.value
                                )
                            }
                            placeholder="Enter message subject"
                            disabled={messageLoading}
                        />

                    </div>


                    <div className="admin-message-field">

                        <label htmlFor="message-content">
                            Message
                        </label>

                        <textarea
                            id="message-content"
                            value={messageContent}
                            onChange={(event) =>
                                setMessageContent(
                                    event.target.value
                                )
                            }
                            placeholder="Write your message..."
                            rows={7}
                            disabled={messageLoading}
                        />

                    </div>


                    {messageError && (
                        <p className="error-text">
                            {messageError}
                        </p>
                    )}


                    {messageSuccess && (
                        <p className="admin-message-success">
                            {messageSuccess}
                        </p>
                    )}


                    <button
                        type="submit"
                        className="primary-button"
                        disabled={messageLoading}
                    >
                        {messageLoading
                            ? "Sending..."
                            : messageAudience === "all"
                                ? "Send to All Shops"
                                : "Send to Selected Shops"}
                    </button>

                </form>

            </section>

        )}

    </>
)}

{selectedAdminMessage && (
    <div
        className="admin-modal-overlay"
        onClick={() =>
            setSelectedAdminMessage(null)
        }
    >

        <div
            className="admin-message-history-modal"
            onClick={(event) =>
                event.stopPropagation()
            }
        >

            <div className="admin-modal-header">

                <div>

                    <span className="eyebrow">
                        SENT MESSAGE
                    </span>

                    <h2>
                        {selectedAdminMessage.subject}
                    </h2>

                </div>

                <button
                    className="admin-modal-close"
                    onClick={() =>
                        setSelectedAdminMessage(null)
                    }
                >
                    ×
                </button>

            </div>


            <div className="admin-message-history-meta">

                <span>
                    Recipients
                </span>

                <strong>
                    {selectedAdminMessage.recipient_count}
                </strong>

            </div>


            <div className="admin-message-history-content">

                {selectedAdminMessage.content}

            </div>


            <div className="admin-message-history-time">

                Sent{" "}
                {new Date(
                    selectedAdminMessage.created_at
                ).toLocaleString("en-IN")}

            </div>

        </div>

    </div>
)}

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