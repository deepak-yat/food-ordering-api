import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

function ReviewModal({ item, onClose, onReviewUpdated }) {
    const [activeTab, setActiveTab] = useState("reviews");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const feedbackTags = [
    "Tasty",
    "Fresh",
    "Good Portion",
    "Well Cooked",
    "Good Value",
    ];
    const [formRating, setFormRating] = useState(0);
const [formComment, setFormComment] = useState("");
const [formTags, setFormTags] = useState([]);
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState("");
    async function loadReviews(page = 1, append = false) {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const response = await apiFetch(
                `/customer/menu-items/${item.item_id}/reviews?page=${page}&limit=10`
            );

            if (append) {
                setData((previous) => ({
                    ...response,
                    reviews: [
                        ...(previous?.reviews || []),
                        ...response.reviews,
                    ],
                }));
            } else {
                setData(response);
            }
        } catch (error) {
            console.error("Failed to load reviews:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    useEffect(() => {
        loadReviews(1);
    }, [item.item_id]);

    useEffect(() => {
        function handleEscape(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    function renderStars(rating) {
        return (
            <span className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={
                            star <= rating
                                ? "review-star filled"
                                : "review-star"
                        }
                    >
                        ★
                    </span>
                ))}
            </span>
        );
    }

    function loadMoreReviews() {
        if (!data || !data.has_more || loadingMore) {
            return;
        }

        loadReviews(data.page + 1, true);
    }

    function toggleFeedbackTag(tag) {
    setFormTags((previousTags) =>
        previousTags.includes(tag)
            ? previousTags.filter((item) => item !== tag)
            : [...previousTags, tag]
    );
}

async function submitFeedback() {
    if (!formRating || submitting) {
        return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
        const response = await apiFetch(
            `/customer/menu-items/${item.item_id}/reviews`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rating: formRating,
                    comment: formComment.trim() || null,
                    tags: formTags,
                }),
            }
        );

        // apiFetch returns parsed JSON.
        const submittedReview = response;

        // Load the latest complete review data.
        const refreshedData = await apiFetch(
            `/customer/menu-items/${item.item_id}/reviews?page=1&limit=10`
        );

        setData(refreshedData);

        if (onReviewUpdated) {
            onReviewUpdated(refreshedData);
        }

        setFormRating(0);
        setFormComment("");
        setFormTags([]);
        setSubmitError("");

        setActiveTab("reviews");
    } catch (error) {
        console.error("Failed to submit feedback:", error);

        setSubmitError(
            error.message || "Failed to submit feedback."
        );
    } finally {
        setSubmitting(false);
    }
}

    return (
        <div
            className="review-modal-overlay"
            onMouseDown={handleBackdropClick}
        >
            <div
                className="review-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
                onMouseDown={(event) => event.stopPropagation()}
            >

                {/* Header */}

                <div className="review-modal-header">

                    <div className="review-modal-item">

                        <div className="review-modal-image">
                            {item.image_url ? (
                                <img
                                    src={`http://127.0.0.1:8000${item.image_url}`}
                                    alt={item.name}
                                />
                            ) : (
                                <div className="review-modal-image-placeholder">
                                    No Image
                                </div>
                            )}

                            <span className="menu-item-rating-badge">
                                <span className="menu-item-rating-star">
                                    ★
                                </span>

                                <span>
                                    {item.average_rating != null
                                        ? item.average_rating.toFixed(1)
                                        : "5.0"}
                                </span>
                            </span>
                        </div>

                        <div className="review-modal-item-info">

                            <h2 id="review-modal-title">
                                {item.name}
                            </h2>

                            <strong>
                                ₹{Number(item.price).toFixed(2)}
                            </strong>

                            <p>
                                {item.description || "No description"}
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        className="review-modal-close"
                        onClick={onClose}
                        aria-label="Close reviews"
                    >
                        ×
                    </button>

                </div>


                {/* Tabs */}

                <div className="review-modal-tabs">

                    <button
                        type="button"
                        className={
                            activeTab === "reviews"
                                ? "review-modal-tab active"
                                : "review-modal-tab"
                        }
                        onClick={() => setActiveTab("reviews")}
                    >
                        Reviews
                        {data?.summary?.review_count != null && (
                            <> ({data.summary.review_count})</>
                        )}
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "add"
                                ? "review-modal-tab active"
                                : "review-modal-tab"
                        }
                        onClick={() => setActiveTab("add")}
                    >
                        Add Feedback
                    </button>

                </div>


                {/* Body */}

                <div className="review-modal-body">

                    {activeTab === "reviews" ? (

                        loading ? (

                            <div className="review-modal-loading">
                                Loading reviews...
                            </div>

                        ) : (

                            <>
                                {/* Rating Summary */}

                                <div className="review-rating-summary">

                                    <div className="review-rating-overall">

                                        <strong>
                                            {data?.summary?.average_rating?.toFixed(1) || "0.0"}
                                        </strong>

                                        {renderStars(
                                            Math.round(
                                                data?.summary?.average_rating || 0
                                            )
                                        )}

                                        <span>
                                            Based on{" "}
                                            {data?.summary?.review_count || 0}{" "}
                                            reviews
                                        </span>

                                    </div>


                                    {/* Distribution */}

                                    <div className="review-rating-distribution">

                                        {[5, 4, 3, 2, 1].map((rating) => {

                                            const count =
                                                data?.summary?.rating_distribution?.[
                                                    String(rating)
                                                ] || 0;

                                            const maximum = Math.max(
                                                ...(Object.values(
                                                    data?.summary?.rating_distribution || {}
                                                ).map(Number)),
                                                1
                                            );

                                            const percentage =
                                                (count / maximum) * 100;

                                            return (
                                                <div
                                                    key={rating}
                                                    className="review-distribution-row"
                                                >

                                                    <span>
                                                        {rating} ★
                                                    </span>

                                                    <div className="review-distribution-bar">
                                                        <div
                                                            className="review-distribution-fill"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <span>
                                                        {count}
                                                    </span>

                                                </div>
                                            );
                                        })}

                                    </div>

                                </div>


                                {/* Reviews */}

                                <div className="review-list">

                                    {data?.reviews?.length === 0 ? (

                                        <div className="review-empty">
                                            No reviews yet.
                                        </div>

                                    ) : (

                                        data.reviews.map((review) => (

                                            <article
                                                key={review.review_id}
                                                className="review-entry"
                                            >

                                                <div className="review-avatar">
                                                    {review.customer_name
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div className="review-entry-content">

                                                    <div className="review-entry-top">

                                                        <strong>
                                                            {review.customer_name}
                                                        </strong>

                                                        <span>
                                                            {new Date(
                                                                review.created_at
                                                            ).toLocaleDateString(
                                                                "en-IN",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }
                                                            )}
                                                        </span>

                                                    </div>

                                                    <div className="review-entry-rating">

                                                        {renderStars(
                                                            review.rating
                                                        )}

                                                        {review.verified_order && (
                                                            <span className="review-verified">
                                                                ✓ Verified Order
                                                            </span>
                                                        )}

                                                    </div>

                                                    {review.comment && (
                                                        <p>
                                                            {review.comment}
                                                        </p>
                                                    )}

                                                    {review.tags?.length > 0 && (
                                                        <div className="review-tags">

                                                            {review.tags.map(
                                                                (tag) => (
                                                                    <span
                                                                        key={tag}
                                                                    >
                                                                        {tag}
                                                                    </span>
                                                                )
                                                            )}

                                                        </div>
                                                    )}

                                                </div>

                                            </article>

                                        ))

                                    )}

                                </div>


                                {data?.has_more && (
                                    <button
                                        type="button"
                                        className="review-load-more"
                                        onClick={loadMoreReviews}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore
                                            ? "Loading..."
                                            : "Load More"}
                                    </button>
                                )}

                            </>

                        )

                    ) : (

                        <div className="review-add-feedback">
    {!data?.can_review ? (
        <div className="review-feedback-disabled">
            <h3>Can't leave feedback</h3>

            <p>
                {data?.cannot_review_reason === "sign_in_required"
                    ? "Sign in to leave a review."
                    : "Order this item to leave a review, or you've already reviewed your completed order of it."}
            </p>
        </div>
    ) : (
        <>
            <div className="review-feedback-section">
                <h3>Your rating</h3>

                <div className="review-star-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={
                                star <= formRating
                                    ? "review-input-star selected"
                                    : "review-input-star"
                            }
                            aria-label={`Rate ${star} star${
                                star === 1 ? "" : "s"
                            }`}
                            onClick={() => {
                                setFormRating(star);
                                setSubmitError("");
                            }}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <div className="review-feedback-section">
                <div className="review-feedback-label-row">
                    <h3>Your feedback</h3>

                    <span>
                        {formComment.length} / 500
                    </span>
                </div>

                <textarea
                    value={formComment}
                    onChange={(event) =>
                        setFormComment(event.target.value)
                    }
                    maxLength={500}
                    placeholder="Tell us what you liked about this item..."
                    className="review-feedback-textarea"
                />
            </div>

            <div className="review-feedback-section">
                <h3>What did you like?</h3>

                <div className="review-feedback-tags">
                    {feedbackTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={
                                formTags.includes(tag)
                                    ? "review-tag-pill selected"
                                    : "review-tag-pill"
                            }
                            onClick={() =>
                                toggleFeedbackTag(tag)
                            }
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {submitError && (
                <p className="review-submit-error">
                    {submitError}
                </p>
            )}

           <button
    type="button"
    className="review-submit-button"
    disabled={formRating === 0 || submitting}
    onClick={submitFeedback}
>
    {submitting ? "Submitting..." : "Submit Feedback"}
</button>
        </>
    )}
</div>

                    )}

                </div>

            </div>
        </div>
    );
}

export default ReviewModal;