import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useNavigate } from "react-router-dom";

function ShopMessages() {

    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadMessages();
    }, []);

    async function loadMessages() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch(
                "/shop/messages"
            );

            setMessages(data.messages || []);

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
                "Unable to load messages."
            );

        } finally {
            setLoading(false);
        }
    }

    function getPreview(content) {
        if (!content) {
            return "";
        }

        return content.length > 90
            ? `${content.slice(0, 90)}...`
            : content;
    }

    function formatDate(dateString) {
        if (!dateString) {
            return "";
        }

        return new Date(dateString).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    return (
        <div className="shop-messages-page">

            <div className="shop-messages-header">

                <div>
                    <span className="eyebrow">
                        COMMUNICATION
                    </span>

                    <h1>
                        Messages
                    </h1>

                    <p>
                        Updates and announcements from Foodly.
                    </p>
                </div>

                <button
                    className="shop-messages-back-btn"
                    onClick={() =>
                        navigate("/shop/dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>

            {loading && (
                <p className="shop-messages-status">
                    Loading messages...
                </p>
            )}

            {error && (
                <p className="shop-messages-error">
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                messages.length === 0 && (
                    <div className="shop-messages-empty">

                        <h2>
                            No messages
                        </h2>

                        <p>
                            You don't have any messages from Foodly yet.
                        </p>

                    </div>
                )}

            {!loading &&
                !error &&
                messages.length > 0 && (

                <div className="shop-messages-list">

                    {messages.map((message) => (

                        <button
                            key={message.recipient_id}
                            className={`shop-message-card ${
                                message.is_read
                                    ? "read"
                                    : "unread"
                            }`}
                            onClick={() =>
                                navigate(
                                    `/shop/messages/${message.recipient_id}`
                                )
                            }
                        >

                            <div className="shop-message-card-top">

                                <div>

                                    <h2>
                                        {message.subject}
                                    </h2>

                                    {!message.is_read && (
                                        <span className="shop-message-new">
                                            NEW
                                        </span>
                                    )}

                                </div>

                                <span className="shop-message-date">
                                    {formatDate(
                                        message.created_at
                                    )}
                                </span>

                            </div>

                            <p>
                                {getPreview(
                                    message.content
                                )}
                            </p>

                        </button>

                    ))}

                </div>
            )}

        </div>
    );
}

export default ShopMessages;