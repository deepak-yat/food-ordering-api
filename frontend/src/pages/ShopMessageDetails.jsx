import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

function ShopMessageDetails() {

    const navigate = useNavigate();
    const { recipientId } = useParams();

    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

   useEffect(() => {
    loadMessages(recipientId);
}, [recipientId]);

    async function loadMessages(recipientId) {
    try {
        setLoading(true);
        setError("");

        const data = await apiFetch(
            "/shop/messages"
        );

        const selectedMessage = (
            data.messages || []
        ).find(
            item =>
                item.recipient_id === Number(recipientId)
        );

        if (!selectedMessage) {
            setError("Message not found.");
            return;
        }

        setMessage(selectedMessage);

        // Mark unread message as read
        if (!selectedMessage.is_read) {
            await apiFetch(
                `/shopmessages/${recipientId}/read`,
                {
                    method: "PUT"
                }
            );

            setMessage(currentMessage => ({
                ...currentMessage,
                is_read: true
            }));
        }

    } catch (error) {
        console.error(
            "Unable to load message:",
            error
        );

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
            "Unable to load message."
        );

    } finally {
        setLoading(false);
    }
}

    function formatDate(dateString) {
        if (!dateString) {
            return "";
        }

        return new Date(dateString).toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    if (loading) {
        return (
            <div className="shop-message-details-page">
                <p className="shop-messages-status">
                    Loading message...
                </p>
            </div>
        );
    }

    return (
        <div className="shop-message-details-page">

            <button
                className="shop-message-details-back"
                onClick={() =>
                    navigate("/shop/messages")
                }
            >
                ← Back to Messages
            </button>

            {error && (
                <p className="shop-messages-error">
                    {error}
                </p>
            )}

            {!error && message && (

                <article className="shop-message-details-card">

                    <div className="shop-message-details-header">

                        <span className="eyebrow">
                            FOODLY MESSAGE
                        </span>

                        <span className="shop-message-details-date">
                            {formatDate(
                                message.created_at
                            )}
                        </span>

                    </div>

                    <h1>
                        {message.subject}
                    </h1>

                    <div className="shop-message-details-content">
                        {message.content}
                    </div>
                    <div className="shop-message-details-actions">

    <button
        type="button"
        className="shop-message-reply-btn"
        disabled
        title="Reply feature coming soon"
    >
        Reply
    </button>

</div>

                </article>

            )}

        </div>
    );
}

export default ShopMessageDetails;