import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiFetch } from "../api/client";
import "../styles/ActiveDeliveryTracking.css";

function ActiveDeliveryTracking() {
    const { deliveryId } = useParams();
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [completionDetails, setCompletionDetails] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    useEffect(() => {
        let isMounted = true;

        async function loadDelivery() {
            try {
                setLoading(true);
                setError("");

                const data = await apiFetch("/delivery-partner/active");

                if (!isMounted) return;

                const activeDelivery = data.delivery || null;

                if (
                    activeDelivery &&
                    String(activeDelivery.delivery_id) !== String(deliveryId)
                ) {
                    setError("This delivery is not your current active delivery.");
                    setDelivery(null);
                    return;
                }

                setDelivery(activeDelivery);

                if (!activeDelivery) {
                    setError("No active delivery was found.");
                }
            } catch (err) {
                if (!isMounted) return;

                console.error("Failed to load delivery:", err);

                setError(
                    err.data?.detail ||
                    err.message ||
                    "Unable to load delivery details."
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadDelivery();

        return () => {
            isMounted = false;
        };
    }, [deliveryId]);

useEffect(() => {
    if (delivery?.status !== "ARRIVED_AT_SHOP") {
        return;
    }

    const intervalId = setInterval(async () => {
        try {
            const data = await apiFetch("/delivery-partner/active");

            if (
                data.delivery &&
                String(data.delivery.delivery_id) === String(deliveryId)
            ) {
                setDelivery(data.delivery);
            }
        } catch (err) {
            console.error("Failed to refresh pickup verification:", err);
        }
    }, 5000);

    return () => clearInterval(intervalId);
}, [delivery?.status, deliveryId]);

    useEffect(() => {
    if (
        delivery?.status !== "OUT_FOR_DELIVERY" ||
        !delivery?.out_for_delivery_at
    ) {
        setRemainingSeconds(0);
        return;
    }

    const startTime = new Date(
        delivery.out_for_delivery_at
    ).getTime();

    const cooldownMilliseconds = 5 * 60 * 1000;

    function updateCountdown() {
        const elapsed = Date.now() - startTime;

        const remaining = Math.max(
            0,
            Math.ceil(
                (cooldownMilliseconds - elapsed) / 1000
            )
        );

        setRemainingSeconds(remaining);
    }

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
}, [delivery?.status, delivery?.out_for_delivery_at]);
    if (completionDetails) {
    return (
        <div className="adt-page adt-completion-page">
            <div className="adt-completion-card">
                <div className="adt-completion-check">
                    ✓
                </div>

                <h1>Delivery Completed Successfully!</h1>

                <p>
                    Great job! You have successfully completed the delivery.
                </p>

                <div className="adt-completion-details">
                    <p>
                        <strong>Order ID:</strong>{" "}
                        #{completionDetails.orderId}
                    </p>

                    <p>
                        <strong>Delivery ID:</strong>{" "}
                        #{completionDetails.deliveryId}
                    </p>
                </div>

                <p className="adt-completion-redirect">
                    Redirecting you to your dashboard in 3 seconds...
                </p>

                <div className="adt-completion-progress">
                    <div />
                </div>
            </div>
        </div>
    );
}

    if (loading) {
        return (
            <div className="adt-page">
                <p className="adt-message">Loading delivery details...</p>
            </div>
        );
    }

    if (error || !delivery) {
        return (
            <div className="adt-page">
                <button
                    className="adt-back-button"
                    onClick={() => navigate("/delivery-partner/dashboard")}
                >
                    ← Back to Dashboard
                </button>

                <div className="adt-message adt-error">
                    {error || "Delivery details are unavailable."}
                </div>
            </div>
        );
    }

    const steps = [
        { status: "ASSIGNED", label: "Delivery Assigned" },
        { status: "ARRIVED_AT_SHOP", label: "Arrived at Restaurant" },
        { status: "PICKED_UP", label: "Order Picked Up" },
        { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
        { status: "ARRIVED_AT_CUSTOMER", label: "Arrived at Customer" },
        { status: "DELIVERED", label: "Delivery Completed" },
    ];

    const currentStep = steps.findIndex(
        (step) => step.status === delivery.status
    );


    async function handleArrivedAtShop() {
        if (!delivery) return;

        setActionLoading(true);
        setActionError("");
        setActionSuccess("");

        try {
            const result = await apiFetch(
                `/delivery-partner/deliveries/${delivery.delivery_id}/arrived-at-shop`,
                {
                    method: "POST",
                }
            );

            setActionSuccess(
                result.message || "Arrival at restaurant recorded successfully."
            );

            // Refresh the delivery information from the backend.
            const data = await apiFetch("/delivery-partner/active");

            if (data.delivery) {
                setDelivery(data.delivery);
            }
        } catch (error) {
            setActionError(
                error.data?.detail ||
                error.message ||
                "Failed to update delivery status."
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handlePickedUp() {
    if (!delivery) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
        const result = await apiFetch(
            `/delivery-partner/deliveries/${delivery.delivery_id}/picked-up`,
            {
                method: "POST",
            }
        );

        setActionSuccess(
            result.message || "Order pickup recorded successfully."
        );

        const data = await apiFetch("/delivery-partner/active");

        if (data.delivery) {
            setDelivery(data.delivery);
        }
    } catch (error) {
        setActionError(
            error.data?.detail ||
            error.message ||
            "Failed to update delivery status."
        );
    } finally {
        setActionLoading(false);
    }
}


async function handleStartDelivery() {
    if (!delivery) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
        const result = await apiFetch(
            `/delivery-partner/deliveries/${delivery.delivery_id}/out-for-delivery`,
            {
                method: "POST",
            }
        );

        setActionSuccess(
            result.message || "Delivery started successfully."
        );

        const data = await apiFetch("/delivery-partner/active");

        if (data.delivery) {
            setDelivery(data.delivery);
        }
    } catch (error) {
        setActionError(
            error.data?.detail ||
            error.message ||
            "Failed to start delivery."
        );
    } finally {
        setActionLoading(false);
    }
}

async function handleArrivedAtCustomer() {
    if (!delivery) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
        const result = await apiFetch(
            `/delivery-partner/deliveries/${delivery.delivery_id}/arrived-at-customer`,
            {
                method: "POST",
            }
        );

        setActionSuccess(
            result.message || "Arrived at customer location successfully."
        );

        const data = await apiFetch("/delivery-partner/active");

        if (data.delivery) {
            setDelivery(data.delivery);
        }
    } catch (error) {
        setActionError(
            error.data?.detail ||
            error.message ||
            "Failed to update delivery status."
        );
    } finally {
        setActionLoading(false);
    }
}

async function handleVerifyOtp(event) {
    event.preventDefault();

    if (!delivery || otp.length !== 6) return;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
        const result = await apiFetch(
            `/delivery-partner/deliveries/${delivery.delivery_id}/verify-handover-otp?otp=${encodeURIComponent(otp)}`,
            {
                method: "POST",
            }
        );

        setCompletionDetails({
    deliveryId: delivery.delivery_id,
    orderId: delivery.order_id,
});

setOtp("");
setActionSuccess("Delivery completed successfully!");

// Show the completion screen for 3 seconds, then return to dashboard.
setTimeout(() => {
    navigate("/delivery-partner/dashboard", {
        replace: true,
        state: { deliveryCompleted: true },
    });
}, 3000);
    } catch (error) {
        setActionError(
            error.data?.detail ||
            error.message ||
            "OTP verification failed."
        );
    } finally {
        setActionLoading(false);
    }
}

    return (
        <div className="adt-page">
            <header className="adt-header">
                <button
                    className="adt-back-button"
                    onClick={() => navigate("/delivery-partner/dashboard")}
                >
                    ← Dashboard
                </button>

                <div>
                    <h1>Delivery Tracking</h1>
                    <p>Follow your delivery from pickup to completion.</p>
                </div>
            </header>

            <main className="adt-content">
                <section className="adt-card">
                    <div className="adt-order-heading">
                        <div>
                            <span className="adt-label">ORDER</span>
                            <h2>#{delivery.order_id}</h2>
                            <p>{delivery.shop?.shop_name || "Restaurant"}</p>
                        </div>

                        <span className="adt-status">
                            {delivery.status.replaceAll("_", " ")}
                        </span>
                    </div>

                    <div className="adt-detail-grid">
                        <div>
                            <span className="adt-label">DELIVERY DISTANCE</span>
                            <strong>
                                {delivery.distance_km ?? "N/A"} km
                            </strong>
                        </div>

                        <div>
                            <span className="adt-label">DELIVERY FEE</span>
                            <strong>
                                ₹{delivery.customer_fee ?? 0}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="adt-card">
                    <h2>Delivery Progress</h2>

                    <div className="adt-timeline">
                        {steps.map((step, index) => {
                            const completed =
                                currentStep >= 0 && index <= currentStep;

                            return (
                                <div
                                    className={`adt-timeline-step ${
                                        completed ? "completed" : ""
                                    }`}
                                    key={step.status}
                                >
                                    <div className="adt-timeline-marker">
                                        {completed ? "✓" : index + 1}
                                    </div>

                                    <div>
                                        <h3>{step.label}</h3>
                                        <p>
                                            {index === currentStep
                                                ? "Current stage"
                                                : completed
                                                ? "Completed"
                                                : "Pending"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="adt-card">
                    <h2>Customer Details</h2>

                    <div className="adt-customer-details">
                        <p>
                            <strong>Name:</strong>{" "}
                            {delivery.customer?.name || "N/A"}
                        </p>

                        <p>
                            <strong>Phone:</strong>{" "}
                            {delivery.customer?.phone || "N/A"}
                        </p>

                        <p>
                            <strong>Address:</strong>{" "}
                            {[
                                delivery.delivery_address?.address_line1,
                                delivery.delivery_address?.address_line2,
                                delivery.delivery_address?.city,
                                delivery.delivery_address?.state,
                                delivery.delivery_address?.pincode,
                            ]
                                .filter(Boolean)
                                .join(", ") || "Address unavailable"}
                        </p>
                    </div>
                </section>

                {delivery?.status === "ASSIGNED" && (
    <button
        type="button"
        onClick={handleArrivedAtShop}
        disabled={actionLoading}
        className="adt-action-button"
    >
        {actionLoading
            ? "Updating..."
            : "Arrived at Restaurant"}
    </button>
)}
{delivery?.status === "ARRIVED_AT_SHOP" && (
    <>
        <section className="adt-card">
            <h2>Restaurant Pickup Verification</h2>

            {!delivery.pickup_verified && delivery.pickup_otp ? (
                <div>
                    <p>
                        Share this code with the restaurant staff
                        to verify the order pickup.
                    </p>

                    <div className="adt-pickup-otp">
                        {delivery.pickup_otp}
                    </div>

                    <p>
                        Waiting for restaurant verification...
                    </p>
                </div>
            ) : delivery.pickup_verified ? (
                <div>
                    <h3>✓ Pickup Verified</h3>
                    <p>
                        The restaurant has verified your pickup.
                        You can now collect the order.
                    </p>
                </div>
            ) : (
                <p>
                    Pickup code unavailable or expired.
                    Please contact the restaurant staff.
                </p>
            )}
        </section>

        <button
            type="button"
            onClick={handlePickedUp}
            disabled={actionLoading || !delivery.pickup_verified}
            className="adt-action-button"
        >
            {actionLoading
                ? "Updating..."
                : !delivery.pickup_verified
                ? "Waiting for Verification"
                : "Picked Up Order"}
        </button>
    </>
)}
{delivery?.status === "PICKED_UP" && (
    <button
        type="button"
        onClick={handleStartDelivery}
        disabled={actionLoading}
        className="adt-action-button"
    >
        {actionLoading ? "Updating..." : "Start Delivery"}
    </button>
)}
{delivery?.status === "OUT_FOR_DELIVERY" && (
    <div className="adt-arrival-section">
        {remainingSeconds > 0 && (
            <p className="adt-cooldown-message">
                You can mark arrival in{" "}
                <strong>
                    {String(
                        Math.floor(remainingSeconds / 60)
                    ).padStart(2, "0")}
                    :
                    {String(
                        remainingSeconds % 60
                    ).padStart(2, "0")}
                </strong>
            </p>
        )}

        <button
            type="button"
            onClick={handleArrivedAtCustomer}
            disabled={actionLoading || remainingSeconds > 0}
            className="adt-action-button"
        >
            {actionLoading
                ? "Updating..."
                : remainingSeconds > 0
                ? "Waiting for Cooldown"
                : "Arrived at Customer"}
        </button>
    </div>
)}
{delivery?.status === "ARRIVED_AT_CUSTOMER" && (
    <div className="adt-otp-section">
        <h3>Complete Delivery</h3>

        <p>
            Ask the customer for the delivery verification OTP
            from their Foodly notifications.
        </p>

        <form onSubmit={handleVerifyOtp}>
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                required
            />

            <button
                type="submit"
                disabled={actionLoading || otp.length !== 6}
                className="adt-action-button"
            >
                {actionLoading ? "Verifying..." : "Verify & Complete Delivery"}
            </button>
        </form>
    </div>
)}


{actionError && (
    <p className="adt-action-error">
        {actionError}
    </p>
)}

{actionSuccess && (
    <p className="adt-action-success">
        {actionSuccess}
    </p>
)}
            </main>
        </div>
    );
}

export default ActiveDeliveryTracking;