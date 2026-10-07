import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";


function OfferList({ offers, selectedOffer, onSelectOffer }) {
    return (
        <div className="offers-list-section">
            <div className="offers-list-header">
                <div>
                    <h2>Offers</h2>
                    <p>Select an offer to view its details.</p>
                </div>

                <span className="offers-count">
                    {offers.length} {offers.length === 1 ? "Offer" : "Offers"}
                </span>
            </div>

            <div className="offers-list-viewport">
                {offers.map((offer) => (
                    <button
                        key={offer.offer_id}
                        type="button"
                        className={`offer-list-item ${
                            selectedOffer?.offer_id === offer.offer_id
                                ? "selected"
                                : ""
                        }`}
                        onClick={() => onSelectOffer(offer)}
                    >
                        <div className="offer-list-image-wrapper">
                            {offer.image_url ? (
                                <img
                                    src={`http://127.0.0.1:8000${offer.image_url}`}
                                    alt={offer.title}
                                    className="offer-list-image"
                                />
                            ) : (
                                <div className="offer-list-image-placeholder">
                                    OFF
                                </div>
                            )}
                        </div>

                        <div className="offer-list-content">
                            <div className="offer-list-title-row">
                                <h3>{offer.title}</h3>

                                <span
                                    className={`offer-status ${offer.status.toLowerCase()}`}
                                >
                                    {offer.status}
                                </span>
                            </div>

                            <div className="offer-list-meta">
                                <strong>
                                    {offer.discount_type === "PERCENTAGE"
                                        ? `${offer.discount_value}% OFF`
                                        : `₹${offer.discount_value} OFF`}
                                </strong>

                                <span>
                                    {offer.items?.length || 0}{" "}
                                    {offer.items?.length === 1
                                        ? "item"
                                        : "items"}
                                </span>
                            </div>

                            <span className="offer-list-view">
                                View Details →
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}


function ShopOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [form, setForm] = useState({
        title: "",
        description: "",
        discount_type: "PERCENTAGE",
        discount_value: "",
        start_at: "",
        end_at: "",
        is_active: true,
        item_ids: [],
    });

    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [menuItems, setMenuItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [offerImage, setOfferImage] = useState(null);
    const [editingOffer, setEditingOffer] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState("");
    useEffect(() => {
        loadOffers();
        loadMenuItems();
    }, []);

    async function loadOffers() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/shop/offers");

            setOffers(data || []);
        } catch (error) {
            console.error("Unable to load offers:", error);

            setError(
                error.message || "Unable to load offers."
            );
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }

    function getDiscountText(offer) {
        if (offer.discount_type === "PERCENTAGE") {
            return `${offer.discount_value}% OFF`;
        }

        return `₹${offer.discount_value} OFF`;
    }
function isOfferLive(offer) {
    const now = new Date();
    const start = new Date(offer.start_at);
    const end = new Date(offer.end_at);

    return (
        offer.is_active &&
        start <= now &&
        end > now
    );
}

function isOfferExpired(offer) {
    const now = new Date();
    const end = new Date(offer.end_at);

    return end <= now;
}
const liveOffers = offers.filter((offer) => isOfferLive(offer));

const expiredOffers = offers.filter((offer) => isOfferExpired(offer));
    if (loading) {
        return (
            <main className="shop-page">
                <p>Loading offers...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="shop-page">
                <h1>Offers & Discounts</h1>
                <p>{error}</p>
            </main>
        );
    }

    async function createOffer() {
        try {
            setCreating(true);
            setCreateError("");

            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                discount_type: form.discount_type,
                discount_value: Number(form.discount_value),
                start_at: new Date(form.start_at).toISOString(),
                end_at: new Date(form.end_at).toISOString(),
                is_active: form.is_active,
                item_ids: form.item_ids,
            };

            const createdOffer = await apiFetch("/shop/offers", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            let finalOffer = createdOffer;

            if (offerImage) {
                const formData = new FormData();

                formData.append("image", offerImage);

                finalOffer = await apiFetch(
                    `/shop/offers/${createdOffer.offer_id}/image`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );
            }

            setOffers((previousOffers) => [
                ...previousOffers,
                finalOffer,
            ]);

            setForm({
                title: "",
                description: "",
                discount_type: "PERCENTAGE",
                discount_value: "",
                start_at: "",
                end_at: "",
                is_active: true,
                item_ids: [],
            });

            setOfferImage(null);
            setShowCreateForm(false);

        } catch (error) {
            console.error("Unable to create offer:", error);

            setCreateError(
                error.message || "Unable to create offer."
            );
        } finally {
            setCreating(false);
        }
    }

    async function loadMenuItems() {
        try {
            setLoadingItems(true);

            const data = await apiFetch("/menu/categories/item");
            setMenuItems(data || []);
        } catch (error) {
            console.error("Unable to load menu items:", error);
        } finally {
            setLoadingItems(false);
        }
    }

    async function toggleOffer(offer) {
        try {
            const updatedOffer = await apiFetch(
                `/shop/offers/${offer.offer_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        is_active: !offer.is_active,
                    }),
                }
            );

            setOffers((previousOffers) =>
                previousOffers.map((item) =>
                    item.offer_id === updatedOffer.offer_id
                        ? updatedOffer
                        : item
                )
            );
        } catch (error) {
            console.error("Unable to update offer:", error);

            setError(
                error.message || "Unable to update offer."
            );
        }
    }
    async function updateOffer() {
        try {
            setUpdating(true);
            setUpdateError("");

            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                discount_type: form.discount_type,
                discount_value: Number(form.discount_value),
                start_at: new Date(form.start_at).toISOString(),
                end_at: new Date(form.end_at).toISOString(),
                is_active: form.is_active,
                item_ids: form.item_ids,
            };

            const updatedOffer = await apiFetch(
                `/shop/offers/${editingOffer.offer_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            let finalOffer = updatedOffer;

            if (offerImage) {
                const formData = new FormData();
                formData.append("image", offerImage);

                finalOffer = await apiFetch(
                    `/shop/offers/${editingOffer.offer_id}/image`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );
            }

            setOffers((previousOffers) =>
                previousOffers.map((offer) =>
                    offer.offer_id === finalOffer.offer_id
                        ? finalOffer
                        : offer
                )
            );

            setEditingOffer(null);
            setOfferImage(null);
            setUpdateError("");

        } catch (error) {
            console.error("Unable to update offer:", error);

            setUpdateError(
                error.message || "Unable to update offer."
            );
        } finally {
            setUpdating(false);
        }
    }

    function calculateOfferPrice(item) {
        const originalPrice = Number(item.price);
        const discountValue = Number(form.discount_value);

        if (!discountValue || discountValue <= 0) {
            return originalPrice;
        }

        let offerPrice = originalPrice;

        if (form.discount_type === "PERCENTAGE") {
            offerPrice =
                originalPrice -
                (originalPrice * discountValue) / 100;
        }

        if (form.discount_type === "FIXED_PRICE") {
            offerPrice = discountValue;
        }

        // Never allow an offer price higher than
        // the original price.
        offerPrice = Math.min(
            offerPrice,
            originalPrice
        );

        return Math.round(
            (offerPrice + Number.EPSILON) * 100
        ) / 100;
    }
 function calculateSelectedOfferPrice(item, offer) {
    const originalPrice = Number(item.price);
    const discountValue = Number(offer.discount_value);

    if (!discountValue || discountValue <= 0) {
        return originalPrice;
    }

    let offerPrice = originalPrice;

    if (offer.discount_type === "PERCENTAGE") {
        offerPrice =
            originalPrice -
            (originalPrice * discountValue) / 100;
    }

    if (offer.discount_type === "FIXED_PRICE") {
        offerPrice = discountValue;
    }

    offerPrice = Math.min(
        offerPrice,
        originalPrice
    );

    return Math.round(
        (offerPrice + Number.EPSILON) * 100
    ) / 100;
}
    async function deleteOffer(offer) {
        try {
            setError("");

            await apiFetch(
                `/shop/offers/${offer.offer_id}`,
                {
                    method: "DELETE",
                }
            );

            setOffers((previousOffers) =>
                previousOffers.filter(
                    (item) => item.offer_id !== offer.offer_id
                )
            );
        } catch (error) {
            console.error("Unable to delete offer:", error);

            setError(
                error.message || "Unable to delete offer."
            );
        }
    }


    return (
        <main className="shop-page">
            <div className="shop-page-back">
                <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => window.history.back()}
                >
                    ← Go Back
                </button>
            </div>

            <div className="shop-page-header">
                <div>
                    <h1>Offers & Discounts</h1>
                    <p>
                        Create and manage special offers for your customers.
                    </p>
                </div>

                <button
                    className="primary-btn"
                    onClick={() => {
                        setShowCreateForm(true);
                        setCreateError("");
                    }}
                >
                    Create New Offer
                </button>
            </div>

            {showCreateForm && (
                <div className="offer-form">

                    <h2>
                        {editingOffer ? "Edit Offer" : "Create New Offer"}
                    </h2>

                    {createError && (
                        <p className="form-error">
                            {createError}
                        </p>
                    )}

                    {updateError && (
                        <p className="form-error">
                            {updateError}
                        </p>
                    )}

                    <div className="form-group">
                        <label>Title</label>

                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    title: e.target.value,
                                })
                            }
                            placeholder="Weekend Special"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>

                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value,
                                })
                            }
                            placeholder="20% off on selected items."
                        />
                    </div>

                    <div className="form-group">
                        <label>Offer Image</label>

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                                setOfferImage(e.target.files[0] || null);
                            }}
                        />

                        <small>
                            JPG, PNG or WebP. Maximum size: 5 MB.
                        </small>
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label>Discount Type</label>

                            <select
                                value={form.discount_type}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        discount_type: e.target.value,
                                    })
                                }
                            >
                                <option value="PERCENTAGE">
                                    Percentage
                                </option>

                                <option value="FIXED_PRICE">
                                    Fixed Price
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Discount Value</label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.discount_value}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        discount_value: e.target.value,
                                    })
                                }
                                placeholder={
                                    form.discount_type === "PERCENTAGE"
                                        ? "20"
                                        : "50"
                                }
                            />
                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label>Start Date & Time</label>

                            <input
                                type="datetime-local"
                                value={form.start_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        start_at: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date & Time</label>

                            <input
                                type="datetime-local"
                                value={form.end_at}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        end_at: e.target.value,
                                    })
                                }
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Menu Items</label>

                        {loadingItems ? (
                            <p>Loading menu items...</p>
                        ) : menuItems.length === 0 ? (
                            <p>No menu items available.</p>
                        ) : (
                            <div className="offer-item-selection">

                                {menuItems.map((item) => (
                                    <label
                                        key={item.item_id}
                                        className="offer-item-option"
                                    >


                                        <span className="offer-item-name">
                                            {item.name}
                                        </span>

                                        <div className="offer-item-pricing">

                                            {form.item_ids.includes(item.item_id) &&
                                                Number(form.discount_value) > 0 ? (
                                                <>
                                                    <span className="offer-original-price">
                                                        ₹{Number(item.price).toFixed(2)}
                                                    </span>

                                                    <span className="offer-new-price">
                                                        ₹{calculateOfferPrice(item).toFixed(2)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="offer-original-price">
                                                    ₹{Number(item.price).toFixed(2)}
                                                </span>
                                            )}

                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.item_ids.includes(item.item_id)}
                                            onChange={(e) => {
                                                const itemId = item.item_id;

                                                setForm((previousForm) => ({
                                                    ...previousForm,
                                                    item_ids: e.target.checked
                                                        ? [
                                                            ...previousForm.item_ids,
                                                            itemId,
                                                        ]
                                                        : previousForm.item_ids.filter(
                                                            (id) => id !== itemId
                                                        ),
                                                }));
                                            }}
                                        />
                                    </label>
                                ))}

                            </div>
                        )}
                    </div>

                    <div className="form-actions">

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                                setShowCreateForm(false);
                                setEditingOffer(null);
                                setUpdateError("");
                                setOfferImage(null);
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="primary-btn"
                            onClick={editingOffer ? updateOffer : createOffer}
                            disabled={creating || updating}
                        >
                            {editingOffer
                                ? updating
                                    ? "Updating..."
                                    : "Update Offer"
                                : creating
                                    ? "Creating..."
                                    : "Create Offer"}
                        </button>

                    </div>

                </div>
            )}

            {offers.length === 0 ? (
                <div className="empty-state">
                    <h3>No offers yet</h3>
                    <p>
                        Create your first special offer to attract customers.
                    </p>
                </div>
            ) : (
                <>
<OfferList
    offers={offers}
    selectedOffer={selectedOffer}
    onSelectOffer={setSelectedOffer}
/>
{selectedOffer && (
    <div className="selected-offer-section">

        {/* Header */}
        <div className="selected-offer-header">
            <div>
                <span className="selected-offer-eyebrow">
                    SELECTED OFFER
                </span>

                <h2>{selectedOffer.title}</h2>
            </div>

            <span
                className={`offer-status ${selectedOffer.status.toLowerCase()}`}
            >
                {selectedOffer.status}
            </span>
        </div>

        {/* Banner */}
        {selectedOffer.image_url && (
            <div className="selected-offer-banner">
                <img
                    src={`http://127.0.0.1:8000${selectedOffer.image_url}`}
                    alt={selectedOffer.title}
                />
            </div>
        )}

        {/* Offer Information */}
        <div className="selected-offer-info">

            {/* Discount */}
            <div className="selected-offer-discount">
                {getDiscountText(selectedOffer)}
            </div>

            {/* Description */}
            {selectedOffer.description && (
                <p className="selected-offer-description">
                    {selectedOffer.description}
                </p>
            )}

            {/* Dates */}
            <div className="selected-offer-dates">
                <div>
                    <span>Starts</span>
                    <strong>
                        {formatDate(selectedOffer.start_at)}
                    </strong>
                </div>

                <div>
                    <span>Ends</span>
                    <strong>
                        {formatDate(selectedOffer.end_at)}
                    </strong>
                </div>
            </div>

        </div>

        {/* Offered Items */}
{selectedOffer.items?.length > 0 && (
    <div className="selected-offer-items">

        <div className="selected-offer-items-header">
            <h3>Offered Items</h3>

            <span>
                {selectedOffer.items.length}{" "}
                {selectedOffer.items.length === 1
                    ? "item"
                    : "items"}
            </span>
        </div>

        <div className="selected-offer-items-list">

            {selectedOffer.items.map((item) => {
                const menuItem = menuItems.find(
                    (menuItem) =>
                        menuItem.item_id === item.item_id
                );

                return (
                    <div
                        key={item.item_id}
                        className="selected-offer-item"
                    >

                        <div className="selected-offer-item-info">
                            <strong>
                                {item.item_name}
                            </strong>

                            <span>
                                Original Price: ₹
                                {menuItem
                                    ? Number(menuItem.price).toFixed(2)
                                    : "—"}
                            </span>
                        </div>

                        <div className="selected-offer-item-price">
                            <span>
                                Offer Price
                            </span>

                            <strong>
                                ₹
                                {menuItem
                                    ? calculateSelectedOfferPrice(
                                          menuItem,
                                          selectedOffer
                                      ).toFixed(2)
                                    : "—"}
                            </strong>
                        </div>

                    </div>
                );
            })}

        </div>
    </div>
)}

<div className="selected-offer-actions">
    <button
        type="button"
        className="secondary-btn"
        onClick={() => {
            setEditingOffer(selectedOffer);

            setForm({
                title: selectedOffer.title || "",
                description: selectedOffer.description || "",
                discount_type: selectedOffer.discount_type,
                discount_value: selectedOffer.discount_value,
                start_at: selectedOffer.start_at
                    ? new Date(selectedOffer.start_at)
                          .toISOString()
                          .slice(0, 16)
                    : "",
                end_at: selectedOffer.end_at
                    ? new Date(selectedOffer.end_at)
                          .toISOString()
                          .slice(0, 16)
                    : "",
                is_active: selectedOffer.is_active,
                item_ids: selectedOffer.items?.map(
                    (item) => item.item_id
                ) || [],
            });

            setOfferImage(null);
            setUpdateError("");
        }}
    >
        Edit Offer
    </button>

    <button
        type="button"
        className="secondary-btn"
        onClick={() => toggleOffer(selectedOffer)}
    >
        {selectedOffer.is_active
            ? "Deactivate"
            : "Activate"}
    </button>

    <button
        type="button"
        className="danger-btn"
        onClick={() => {
            if (
                window.confirm(
                    `Delete "${selectedOffer.title}"?`
                )
            ) {
                deleteOffer(selectedOffer);
                setSelectedOffer(null);
            }
        }}
    >
        Delete Offer
    </button>
</div>
{editingOffer && (
    <div className="offer-form selected-offer-edit-form">
        <h2>Edit Offer</h2>

        {updateError && (
            <p className="form-error">
                {updateError}
            </p>
        )}

        <div className="form-group">
            <label>Title</label>

            <input
                type="text"
                value={form.title}
                onChange={(e) =>
                    setForm({
                        ...form,
                        title: e.target.value,
                    })
                }
                placeholder="Weekend Special"
            />
        </div>

        <div className="form-group">
            <label>Description</label>

            <textarea
                value={form.description}
                onChange={(e) =>
                    setForm({
                        ...form,
                        description: e.target.value,
                    })
                }
                placeholder="20% off on selected items."
            />
        </div>

        <div className="form-group">
            <label>Offer Image</label>

            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                    setOfferImage(
                        e.target.files[0] || null
                    );
                }}
            />

            <small>
                JPG, PNG or WebP. Maximum size: 5 MB.
            </small>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Discount Type</label>

                <select
                    value={form.discount_type}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            discount_type: e.target.value,
                        })
                    }
                >
                    <option value="PERCENTAGE">
                        Percentage
                    </option>

                    <option value="FIXED_PRICE">
                        Fixed Price
                    </option>
                </select>
            </div>

            <div className="form-group">
                <label>Discount Value</label>

                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            discount_value: e.target.value,
                        })
                    }
                />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Start Date & Time</label>

                <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            start_at: e.target.value,
                        })
                    }
                />
            </div>

            <div className="form-group">
                <label>End Date & Time</label>

                <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            end_at: e.target.value,
                        })
                    }
                />
            </div>
        </div>
<div className="form-group offer-menu-items-edit">
    <label>Menu Items</label>

    {loadingItems ? (
        <p className="form-help">Loading menu items...</p>
    ) : menuItems.length === 0 ? (
        <p className="form-help">No menu items available.</p>
    ) : (
        <div className="menu-items-selection">
            {menuItems.map((item) => {
                const isSelected = form.item_ids.includes(item.item_id);

                return (
                    <label
                        key={item.item_id}
                        className={`menu-item-option ${
                            isSelected ? "selected" : ""
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                                setForm((prev) => ({
                                    ...prev,
                                    item_ids: isSelected
                                        ? prev.item_ids.filter(
                                              (id) => id !== item.item_id
                                          )
                                        : [
                                              ...prev.item_ids,
                                              item.item_id
                                          ]
                                }));
                            }}
                        />

                        <div className="menu-item-option-info">
                            <strong>{item.item_name}</strong>

                            <span>
                                ₹{Number(item.price).toFixed(2)}
                            </span>
                        </div>
                    </label>
                );
            })}
        </div>
    )}
</div>
        <div className="form-actions">
            <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                    setEditingOffer(null);
                    setUpdateError("");
                    setOfferImage(null);
                }}
            >
                Cancel
            </button>

            <button
                type="button"
                className="primary-btn"
                onClick={updateOffer}
                disabled={updating}
            >
                {updating ? "Updating..." : "Update Offer"}
            </button>
        </div>
    </div>
)}
    </div>
    
)}

</>
            )}

        </main>
    );
}

export default ShopOffers;