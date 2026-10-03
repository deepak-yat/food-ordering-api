import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
function CustomerOrderDetails() {

    const navigate = useNavigate();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [shopReviews, setShopReviews] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [editingReview, setEditingReview] = useState(false);
const [editingReviewId, setEditingReviewId] = useState(null);
    useEffect(() => {
        loadOrder();
    }, [orderId]);

    async function loadOrder() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/customer/orders/${orderId}`,
                {
                    credentials: "include",
                }
            );

            const data = await response.json();
            console.log("Order details:", data);
            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load order"
                );
            }

            setOrder(data);
            await loadShopReviews(data.shop_id);

        } catch (error) {
            console.error("Failed to load order:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }
    async function loadShopReviews(shopId) {
    try {
        setReviewLoading(true);
        setReviewError("");

        const response = await apiFetch(
            `/customer/shops/${shopId}/reviews`
        );

        setShopReviews(response);
    } catch (error) {
        console.error("Failed to load shop reviews:", error);
        setReviewError(
            error.message || "Failed to load shop reviews"
        );
    } finally {
        setReviewLoading(false);
    }
}   

    async function submitShopReview(){
        try{
            setReviewSubmitting(true);
            setReviewError("");

            const response = await apiFetch(
                `/customer/shops/${order.shop_id}/reviews`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json",
                    },
                    body: JSON.stringify({
                        rating: reviewRating,
                        comment: reviewComment.trim() || null,
                    }),
                }
            );
            console.log("Shop review Submitted :",response);
            await loadShopReviews(order.shop_id);

            setReviewRating(5);
            setReviewComment("");
        } catch (error){
            console.error("Failed to submit shop review: ", error);
            setReviewError(
                error.message || "Failed to submit shop review"
            );
        } finally {
            setReviewSubmitting(false);
        }
    }
async function updateShopReview() {
    if (!editingReviewId) return;

    try {
        setReviewSubmitting(true);
        setReviewError("");

        await apiFetch(
            `/customer/shop-reviews/${editingReviewId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rating: reviewRating,
                    comment: reviewComment.trim() || null,
                }),
            }
        );

        await loadShopReviews(order.shop_id);

        setEditingReview(false);
        setEditingReviewId(null);
        setReviewRating(5);
        setReviewComment("");

    } catch (error) {
        console.error("Failed to update shop review:", error);
        setReviewError(
            error.message || "Failed to update shop review"
        );
    } finally {
        setReviewSubmitting(false);
    }
}
    if (loading) {
        return (
            <div className="customer-order-details-page">
                <p className="customer-orders-status">
                    Loading order...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-order-details-page">

                <button
                    className="customer-order-details-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <p className="customer-orders-error">
                    {error}
                </p>

            </div>
        );
    }

const handleReorder = async () => {
    try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
            `/customer/orders/${orderId}/reorder`,
            {
                method: "POST",
            }
        );

        console.log("Reorder response:", response);

        if (response.cart_ready) {
            navigate("/customer/cart");
        } else {
            setError("None of the items could be added to your cart.");
        }

    } catch (error) {
        console.error("Reorder failed:", error);
        setError(error.message || "Unable to reorder this order");
    } finally {
        setLoading(false);
    }
};

async function deleteShopReview(reviewId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete your shop review?"
    );

    if (!confirmed) return;

    try {
        setReviewSubmitting(true);
        setReviewError("");

        await apiFetch(
            `/customer/shop-reviews/${reviewId}`,
            {
                method: "DELETE",
            }
        );

        await loadShopReviews(order.shop_id);

        setEditingReview(false);
        setEditingReviewId(null);
        setReviewRating(5);
        setReviewComment("");

    } catch (error) {
        console.error("Failed to delete shop review:", error);
        setReviewError(
            error.message || "Failed to delete shop review"
        );
    } finally {
        setReviewSubmitting(false);
    }
}


    return (
        <div className="customer-order-details-page">

            {/* Header */}

            <div className="customer-order-details-header">

                <button
                    className="customer-order-details-back-btn"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <div>
                    <span className="eyebrow">
                              <h1 >{order.shop_name}</h1>  
                    </span>

                    <h1>
                        #{order.order_id}
                    </h1>
                </div>

                <span
                    className={`customer-order-details-status ${order.status.toLowerCase()}`}
                >
                    {order.status}
                </span>

            </div>


            {/* Items */}

            <section className="customer-order-details-section">

                <span className="eyebrow">
                    ORDER ITEMS
                </span>

                <div className="customer-order-details-items">

                    {order.items.map((item) => (

                        <div
                            key={item.order_item_id}
                            className="customer-order-details-item"
                        >

                            <div className="customer-order-item-info">

    <strong>
        {item.item_name}
    </strong>

    {item.offer_id ? (
        <div className="customer-order-offer">

            <span className="customer-order-offer-title">
                🔥 {item.offer_title}
            </span>

            <div className="customer-order-price-row">

                <span className="customer-order-original-price">
                    ₹{Number(item.original_unit_price).toFixed(2)}
                </span>

                <strong className="customer-order-discounted-price">
                    ₹{Number(item.unit_price).toFixed(2)}
                </strong>

                <span className="customer-order-saved">
                    Save ₹{Number(item.discount_amount).toFixed(2)}
                </span>

            </div>

            <span className="customer-order-quantity">
                × {item.quantity}
            </span>

        </div>
    ) : (
        <span className="customer-order-normal-price">
            ₹{Number(item.unit_price).toFixed(2)}
            {" × "}
            {item.quantity}
        </span>
    )}

</div>

                            <strong>
                                ₹{item.subtotal}
                            </strong>

                        </div>

                    ))}

                </div>

                <div className="customer-order-details-total">

    <div className="customer-order-details-price-row">
        <span>
            Items Total
        </span>

        <strong>
            ₹{Number(order.total_amount - order.delivery_fee).toFixed(2)}
        </strong>
    </div>

    <div className="customer-order-details-price-row">
        <span>
            Delivery Fee
        </span>

        <strong>
            ₹{Number(order.delivery_fee).toFixed(2)}
        </strong>
    </div>

    <div className="customer-order-details-price-row customer-order-details-grand-total">
        <span>
            Total
        </span>

        <strong>
            ₹{Number(order.total_amount).toFixed(2)}
        </strong>
    </div>

</div>
            </section>


            {/* Delivery Address */}

            <section className="customer-order-details-section">

                <span className="eyebrow">
                    DELIVERY ADDRESS
                </span>

                <div className="customer-order-details-address">

                    <p>
                        {order.delivery_address.address_line1}
                    </p>

                    {order.delivery_address.address_line2 && (
                        <p>
                            {order.delivery_address.address_line2}
                        </p>
                    )}

                    <p>
                        {order.delivery_address.city},{" "}
                        {order.delivery_address.state} -{" "}
                        {order.delivery_address.pincode}
                    </p>

                </div>

            </section>


            {/* Delivery Instructions */}

            {order.delivery_instruction && (
                <section className="customer-order-details-section">

                    <span className="eyebrow">
                        DELIVERY INSTRUCTION
                    </span>

                    <p className="customer-order-details-instruction">
                        {order.delivery_instruction}
                    </p>

                </section>
            )}


    {/* Shop Rating */}

{/* Shop Rating */}

{(shopReviews?.can_review || editingReview) && (
    <section className="customer-order-details-section shop-review-section">

        <span className="eyebrow">
            RATE YOUR EXPERIENCE
        </span>

        <div className="shop-review-content">

            <h3>
                How was your experience with {order.shop_name}?
            </h3>

            <div className="shop-rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={
                            star <= reviewRating
                                ? "shop-rating-star active"
                                : "shop-rating-star"
                        }
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} out of 5`}
                    >
                        ★
                    </button>
                ))}
            </div>

            <p className="shop-rating-value">
                {reviewRating} out of 5
            </p>

            <textarea
                className="shop-review-textarea"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about your experience with this shop..."
                maxLength={500}
                rows={4}
            />

            <div className="shop-review-character-count">
                {reviewComment.length}/500
            </div>
{editingReview && (
    <button
        type="button"
        className="shop-review-cancel-button"
        onClick={() => {
            setEditingReview(false);
            setEditingReviewId(null);
            setReviewError("");
        }}
    >
        Cancel
    </button>
)}
           <button
    type="button"
    className="shop-review-submit-button"
    onClick={editingReview ? updateShopReview : submitShopReview}
    disabled={reviewSubmitting}
>
    {reviewSubmitting
        ? "Saving..."
        : editingReview
            ? "Save Changes"
            : "Submit Review"}
</button>

            {reviewError && (
                <p className="shop-review-error">
                    {reviewError}
                </p>
            )}

        </div>

    </section>
)}

{shopReviews?.reviews?.some((review) => review.is_own) && (
    <section className="customer-order-details-section shop-review-section">

        <span className="eyebrow">
            YOUR SHOP REVIEW
        </span>

        {shopReviews.reviews
            .filter((review) => review.is_own)
            .map((review) => (
                <div
                    key={review.review_id}
                    className="shop-existing-review"
                >

                    <div className="shop-existing-review-rating">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                    </div>

                    {review.comment && (
                        <p className="shop-existing-review-comment">
                            "{review.comment}"
                        </p>
                    )}

                    <span className="shop-existing-review-date">
                        {review.updated_at
                            ? "Updated"
                            : "Submitted"}
                    </span>
<div className="shop-review-actions">

    <button
        type="button"
        className="shop-review-edit-button"
        onClick={() => {
            setReviewRating(review.rating);
            setReviewComment(review.comment || "");
            setEditingReviewId(review.review_id);
            setEditingReview(true);
            setReviewError("");
        }}
    >
        ✏️ Edit Review
    </button>
<button
    type="button"
    className="shop-review-delete-button"
    onClick={() => deleteShopReview(review.review_id)}
    disabled={reviewSubmitting}
>
    🗑️ Delete Review
</button>
</div>
                </div>
            ))}

    </section>
)}

            {/* Contact Shop */}

            <section className="customer-order-details-shop">

                <div>
                    <span className="eyebrow">
                        NEED HELP?
                    </span>

                    <p>
                        Have an issue with this order?
                    </p>
                    <button
    className="customer-order-again-button"
    onClick={handleReorder}
    disabled={loading}
>
    {loading ? "Adding to Cart..." : "🔄 Order Again"}
</button>
                </div>

                <button
                    className="customer-order-contact-shop-btn"
                    onClick={() => {
                        // We'll connect this to the shop contact
                        // information next.
                    }}
                >
                    Contact Shop
                </button>

            </section>

        </div>
    );
}

export default CustomerOrderDetails;