import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/DeliveryPartnerDashboard.css";
import { apiFetch } from "../api/client";
function DeliveryPartnerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState("orders");
    const [isOnline, setIsOnline] = useState(false);
    const [locationLabel, setLocationLabel] = useState(
        "Location not available"
    );
    const [locationError, setLocationError] = useState("");
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const partnerName =
        user?.full_name ||
        user?.name ||
        "Delivery Partner";
    const [activeDelivery, setActiveDelivery] = useState(null);
    const [activeDeliveryLoading, setActiveDeliveryLoading] = useState(false);
    const [activeDeliveryError, setActiveDeliveryError] = useState("");
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(false);
    const [offersError, setOffersError] = useState("");
    const [offerActionLoading, setOfferActionLoading] = useState(null);
useEffect(() => {
    if (!isOnline) {
        setOffers([]);
        loadActiveDelivery();
        return;
    }

    loadOffers();
    loadActiveDelivery();

    const intervalId = setInterval(() => {
        loadOffers();
        loadActiveDelivery();
    }, 5000);

    return () => clearInterval(intervalId);
}, [isOnline]);
    async function handleLogout() {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    const navigationItems = [
        {
            id: "orders",
            icon: "🛵",
            title: "Delivery Orders",
            subtitle: "View & manage incoming orders",
        },
        {
            id: "account",
            icon: "👤",
            title: "Account",
            subtitle: "Profile & vehicle details",
        },
        {
            id: "earnings",
            icon: "▥",
            title: "Earnings",
            subtitle: "Track your revenue",
        },
    ];


    function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(
                new Error(
                    "Your browser does not support location access."
                )
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                let message;

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message =
                            "Location permission was denied. Please allow location access.";
                        break;

                    case error.POSITION_UNAVAILABLE:
                        message =
                            "Your current location is unavailable.";
                        break;

                    case error.TIMEOUT:
                        message =
                            "Location request timed out. Please try again.";
                        break;

                    default:
                        message =
                            "Unable to obtain your current location.";
                }

                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    });
}


async function handleToggleAvailability() {
    if (availabilityLoading) {
        return;
    }

    setAvailabilityLoading(true);
    setLocationError("");

    try {
        // If already online, request to go offline.
        if (isOnline) {
            await apiFetch("/delivery-partner/availability", {
                method: "PATCH",
                body: JSON.stringify({
                    is_online: false,
                }),
            });

            setIsOnline(false);
            return;
        }

        // 1. Obtain the device's current location.
        const position = await getCurrentPosition();

        // 2. Save the coordinates in the backend.
        await apiFetch("/delivery-partner/location", {
            method: "PATCH",
            body: JSON.stringify({
                latitude: position.latitude,
                longitude: position.longitude,
            }),
        });

        // 3. Only after location succeeds, go online.
        await apiFetch("/delivery-partner/availability", {
            method: "PATCH",
            body: JSON.stringify({
                is_online: true,
            }),
        });

        // 4. Update the dashboard.
        try {
    const locationData = await apiFetch(
        "/delivery-partner/reverse-geocode",
        {
            method: "POST",
            body: JSON.stringify({
                latitude: position.latitude,
                longitude: position.longitude,
            }),
        }
    );

    const readableLocation = [
        locationData?.address_line1,
        locationData?.city,
        locationData?.state,
    ]
        .filter(Boolean)
        .join(", ");

    setLocationLabel(
        readableLocation ||
        `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
    );

} catch (error) {
    console.error("Reverse geocoding failed:", error);

    setLocationLabel(
        `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
    );
}
        setIsOnline(true);
    } catch (error) {
        console.error(
            "Failed to update delivery partner availability:",
            error
        );

        setLocationError(
            error.data?.detail ||
                error.message ||
                "Unable to update your availability."
        );
    } finally {
        setAvailabilityLoading(false);
    }
}


async function loadOffers() {
    setOffersLoading(true);
    setOffersError("");

    try {
        const data = await apiFetch("/delivery-partner/offers");

        setOffers(data.offers || []);
    } catch (error) {
        console.error("Failed to load delivery offers:", error);

        setOffersError(
            error.data?.detail ||
            error.message ||
            "Unable to load delivery offers."
        );
    } finally {
        setOffersLoading(false);
    }
}
async function loadActiveDelivery() {
    setActiveDeliveryLoading(true);
    setActiveDeliveryError("");

    try {
        const data = await apiFetch("/delivery-partner/active");
        setActiveDelivery(data.delivery || null);
    } catch (error) {
        console.error("Failed to load active delivery:", error);

        setActiveDeliveryError(
            error.data?.detail ||
                error.message ||
                "Unable to load active delivery."
        );
    } finally {
        setActiveDeliveryLoading(false);
    }
}
async function handleAcceptOffer(deliveryId) {
    setOfferActionLoading(deliveryId);
    setOffersError("");

    try {
        await apiFetch(
            `/delivery-partner/offers/${deliveryId}/accept`,
            {
                method: "POST",
            }
        );

        setOffers((currentOffers) =>
    currentOffers.filter(
        (offer) => offer.delivery_id !== deliveryId
    )
);

await Promise.all([
    loadOffers(),
    loadActiveDelivery(),
]);
    } catch (error) {
        console.error("Failed to accept delivery offer:", error);

        setOffersError(
            error.data?.detail ||
            error.message ||
            "Unable to accept this delivery offer."
        );

        await loadOffers();
    } finally {
        setOfferActionLoading(null);
    }
}

async function handleDeclineOffer(deliveryId) {
    setOfferActionLoading(deliveryId);
    setOffersError("");

    try {
        await apiFetch(
            `/delivery-partner/offers/${deliveryId}/decline`,
            {
                method: "POST",
            }
        );

        setOffers((currentOffers) =>
            currentOffers.filter(
                (offer) => offer.delivery_id !== deliveryId
            )
        );

        await loadOffers();
    } catch (error) {
        console.error("Failed to decline delivery offer:", error);

        setOffersError(
            error.data?.detail ||
            error.message ||
            "Unable to decline this delivery offer."
        );

        await loadOffers();
    } finally {
        setOfferActionLoading(null);
    }
}

    return (
        <div className="dp-dashboard">

            {/* Top Navigation */}
            <header className="dp-topbar">

                <div className="dp-brand">
                    <span className="dp-brand-icon">✦</span>
                    <span>
                        Food<span className="dp-brand-accent">ly</span>
                    </span>
                </div>

                <div className="dp-topbar-right">

                    <div className="dp-location">
                        <span className="dp-location-icon">📍</span>
<div className="dp-location-text">
    <strong>Current Location</strong>
    <span>{locationLabel}</span>
</div>
                        <span className="dp-chevron">⌄</span>
                    </div>

                    <div className="dp-profile-summary">
                        <div className="dp-avatar">
                            {partnerName.charAt(0).toUpperCase()}
                        </div>

                        <div className="dp-profile-text">
                            <strong>{partnerName}</strong>
                            <span>Delivery Partner</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="dp-logout-button"
                        onClick={handleLogout}
                    >
                        <span>⇥</span>
                        Logout
                    </button>

                </div>
            </header>

            <div className="dp-layout">

                {/* Sidebar */}
                <aside className="dp-sidebar">

                    <div className="dp-sidebar-navigation">

                        {navigationItems.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                className={`dp-nav-item ${
                                    activeSection === item.id
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() => {
                                    setActiveSection(item.id);
                                }}
                            >
                                <span className="dp-nav-icon">
                                    {item.icon}
                                </span>

                                <span className="dp-nav-content">
                                    <strong>{item.title}</strong>
                                    <small>{item.subtitle}</small>
                                </span>
                            </button>
                        ))}

                    </div>

                    <div className="dp-sidebar-footer">
                        <span className="dp-footer-dot"></span>
                        <span>Foodly Delivery Partner</span>
                    </div>

                </aside>

                {/* Main Content */}
                <main className="dp-main">

                    {activeSection === "orders" && (
                        <>
                            <section className="dp-page-heading">
                                <div>
                                    <h1>
                                        Welcome back, {partnerName.split(" ")[0]}!
                                    </h1>

                                    <p>
                                        Go online to start receiving delivery orders.
                                    </p>
                                </div>

                                <span className="dp-date">
                                    Delivery Dashboard
                                </span>
                            </section>

                            {/* Availability Card */}
                            <section className="dp-availability-card">

                                <div className="dp-availability-info">
<span
    className={`dp-status-indicator ${
        isOnline ? "online" : ""
    }`}
/>
                                    <div>
                                        <h2>
    You are currently {isOnline ? "Online" : "Offline"}
</h2>

<p>
    {isOnline
        ? "You are available to receive delivery orders."
        : "Go online to receive new delivery orders."}
</p>
                                    </div>
                                </div>

                               <button
    type="button"
    className="dp-online-button"
    onClick={handleToggleAvailability}
    disabled={availabilityLoading}
>
    <span>
        {availabilityLoading ? "…" : isOnline ? "Ⅱ" : "▶"}
    </span>

    {availabilityLoading
        ? "Please wait..."
        : isOnline
            ? "Go Offline"
            : "Go Online"}
</button>

                            </section>
                            {/* Active Orders */}
<section className="dp-active-orders">
    <div className="dp-section-heading">
        <div>
            <h2>Active Orders</h2>
            <p>Track deliveries you have accepted.</p>
        </div>

        <span className="dp-count-badge">
            {activeDelivery ? 1 : 0}
        </span>
    </div>

    {activeDeliveryError && (
        <p className="dp-error-message">
            {activeDeliveryError}
        </p>
    )}

    {!activeDelivery && !activeDeliveryError && (
        <div className="dp-empty-activity">
            <span>🛵</span>
            <p>No active deliveries yet.</p>
            <small>
                Accepted delivery orders will appear here.
            </small>
        </div>
    )}

    {activeDelivery && (
        <article className="dp-active-order-card">
            <div className="dp-active-order-info">
                <div>
                    <h3>Order #{activeDelivery.order_id}</h3>
                    <p>
                        {activeDelivery.shop?.shop_name || "Restaurant"}
                    </p>
                </div>

                <span className="dp-delivery-status">
                    {activeDelivery.status.replaceAll("_", " ")}
                </span>
            </div>

            <div className="dp-active-order-details">
                <p>
                    <strong>Delivery area:</strong>{" "}
                    {activeDelivery.delivery_address?.city || "N/A"}
                </p>

                <p>
                    <strong>Distance:</strong>{" "}
                    {activeDelivery.distance_km ?? "N/A"} km
                </p>
            </div>

            <button
                type="button"
                className="dp-track-delivery-button"
                onClick={() =>
                    navigate(
                        `/delivery/active/${activeDelivery.delivery_id}`
                    )
                }
            >
                Track Delivery →
            </button>
        </article>
    )}
</section>

                        {locationError && (
    <div className="dp-location-error" role="alert">
        {locationError}
    </div>
)}

                            {/* Statistics */}
                            <section className="dp-stats-grid">

                                <div className="dp-stat-card orders-stat">
                                    <div className="dp-stat-icon">🛵</div>

                                    <div>
                                        <strong>0</strong>
                                        <span>Orders Completed</span>
                                        <small>Today</small>
                                    </div>
                                </div>

                                <div className="dp-stat-card earnings-stat">
                                    <div className="dp-stat-icon">₹</div>

                                    <div>
                                        <strong>₹0</strong>
                                        <span>Earnings</span>
                                        <small>Today</small>
                                    </div>
                                </div>

                                <div className="dp-stat-card time-stat">
                                    <div className="dp-stat-icon">◷</div>

                                    <div>
                                        <strong>0 hrs</strong>
                                        <span>Online Time</span>
                                        <small>Today</small>
                                    </div>
                                </div>

                            </section>

                            {/* Orders and Activity */}
                            <section className="dp-content-grid">

                                <div className="dp-orders-panel">

                                    <div className="dp-panel-heading">
                                        <div>
                                            <h2>Incoming Delivery Orders</h2>
                                            <p>
                                                New orders from restaurants will appear here.
                                            </p>
                                        </div>

<span className="dp-count-badge">{offers.length}</span>
                                    </div>

{offersError && (
    <div className="dp-offers-error" role="alert">
        {offersError}
    </div>
)}

{!isOnline ? (
    <div className="dp-empty-orders">
        <div className="dp-empty-illustration">🛵</div>

        <h3>You are offline</h3>

        <p>
            Go online to start receiving delivery orders.
        </p>

        <button
            type="button"
            className="dp-online-button dp-empty-online"
            onClick={handleToggleAvailability}
            disabled={availabilityLoading}
        >
            {availabilityLoading ? "Please wait..." : "Go Online"}
        </button>
    </div>
) : offersLoading && offers.length === 0 ? (
    <div className="dp-empty-orders">
        <div className="dp-empty-illustration">⏳</div>
        <h3>Checking for delivery offers...</h3>
        <p>Please wait while we check for available orders.</p>
    </div>
) : offers.length === 0 ? (
    <div className="dp-empty-orders">
        <div className="dp-empty-illustration">🛵</div>

        <h3>No incoming orders</h3>

        <p>
            You're online! New delivery offers will appear here
            when a restaurant has an order ready for delivery.
        </p>
    </div>
) : (
    <div className="dp-offers-list">
        {offers.map((offer) => {
            const address = offer.delivery_address;

            const formattedAddress = address
                ? [
                      address.address_line1,
                      address.address_line2,
                      address.city,
                      address.state,
                      address.pincode,
                  ]
                      .filter(Boolean)
                      .join(", ")
                : "Delivery address unavailable";

            const customer = offer.customer;
            const isProcessing =
                offerActionLoading === offer.delivery_id;

            return (
                <article
                    className="dp-offer-card"
                    key={offer.delivery_id}
                >
                    <div className="dp-offer-card-header">
                        <div>
                            <span className="dp-offer-label">
                                NEW DELIVERY OFFER
                            </span>

                            <h3>
                                {offer.shop?.shop_name ||
                                    "Restaurant"}
                            </h3>

                            <span className="dp-offer-order-id">
                                Order #{offer.order_id}
                            </span>
                        </div>

                        <span className="dp-offer-status">
                            {offer.delivery_status}
                        </span>
                    </div>

                    <div className="dp-offer-details">
                        <div className="dp-offer-detail">
                            <span className="dp-offer-detail-icon">
                                📍
                            </span>

                            <div>
                                <small>Delivery address</small>
                                <p>{formattedAddress}</p>
                            </div>
                        </div>

                        {customer && (
                            <div className="dp-offer-detail">
                                <span className="dp-offer-detail-icon">
                                    👤
                                </span>

                                <div>
                                    <small>Customer</small>
                                    <p>{customer.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="dp-offer-summary">
                            <div>
                                <small>Delivery distance</small>
                                <strong>
                                    {offer.distance_km != null
                                        ? `${Number(
                                              offer.distance_km
                                          ).toFixed(2)} km`
                                        : "Not available"}
                                </strong>
                            </div>

                            <div>
                                <small>Customer delivery fee</small>
                                <strong>
                                    {offer.customer_fee != null
                                        ? `₹${Number(
                                              offer.customer_fee
                                          ).toFixed(2)}`
                                        : "Not available"}
                                </strong>
                            </div>
                        </div>

                        <div className="dp-offer-expiry">
                            <span>Offer expires:</span>

                            <strong>
                                {offer.offer_expires_at
                                    ? new Date(
                                          offer.offer_expires_at
                                      ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                      })
                                    : "Unknown"}
                            </strong>
                        </div>
                    </div>

                    <div className="dp-offer-actions">
                        <button
                            type="button"
                            className="dp-offer-decline"
                            disabled={isProcessing}
                            onClick={() =>
                                handleDeclineOffer(
                                    offer.delivery_id
                                )
                            }
                        >
                            {isProcessing
                                ? "Please wait..."
                                : "Decline"}
                        </button>

                        <button
                            type="button"
                            className="dp-offer-accept"
                            disabled={isProcessing}
                            onClick={() =>
                                handleAcceptOffer(
                                    offer.delivery_id
                                )
                            }
                        >
                            {isProcessing
                                ? "Please wait..."
                                : "Accept Delivery"}
                        </button>
                    </div>
                </article>
            );
        })}
    </div>
)}

                                </div>

                                <aside className="dp-activity-panel">

                                    <div className="dp-panel-heading">
                                        <h2>Recent Activity</h2>
                                    </div>

                                    <div className="dp-empty-activity">
                                        <span>◷</span>
                                        <p>
                                            Your delivery activity will appear here.
                                        </p>
                                    </div>

                                </aside>

                            </section>
                        </>
                    )}

                    {activeSection === "account" && (
                        <section className="dp-placeholder-page">
                            <div className="dp-placeholder-icon">👤</div>
                            <h1>Account</h1>
                            <p>
                                Manage your personal profile and vehicle details.
                            </p>
                            <span>
                                Account management will be implemented in a later step.
                            </span>
                        </section>
                    )}

                    {activeSection === "earnings" && (
                        <section className="dp-placeholder-page">
                            <div className="dp-placeholder-icon">₹</div>
                            <h1>Earnings</h1>
                            <p>
                                Track revenue from your completed deliveries.
                            </p>
                            <span>
                                Earnings and compensation details will be connected later.
                            </span>
                        </section>
                    )}

                </main>

            </div>
        </div>
    );
}

export default DeliveryPartnerDashboard;