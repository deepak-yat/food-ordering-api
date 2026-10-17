import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/ShopOffers.css";

const API_ORIGIN = "http://127.0.0.1:8000";

const TEMPLATES = [
    {
        id: "editorial-pop",
        name: "Editorial Pop",
        subtitle: "Torn Reveal",
        tone: "editorial",
        description: "Bold torn-paper composition for attention-grabbing deals.",
    },
    {
        id: "premium-feast",
        name: "Premium Feast",
        subtitle: "Elegant & premium",
        tone: "premium",
        description: "A refined, dark design for signature meals and premium offers.",
    },
    {
        id: "sweet-playful",
        name: "Sweet & Playful",
        subtitle: "Bright & cheerful",
        tone: "sweet",
        description: "Playful colours for bakeries, desserts, and treats.",
    },
    {
        id: "urban-crave",
        name: "Urban Crave",
        subtitle: "Bold & modern",
        tone: "urban",
        description: "High-contrast styling for burgers, wraps, and fast food.",
    },
];

const EMPTY_FORM = {
    title: "",
    description: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    start_at: "",
    end_at: "",
    is_active: true,
    item_ids: [],
};

function toLocalDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function getOfferStatus(offer) {
    if (!offer.is_active) return "Inactive";
    const now = Date.now();
    const start = new Date(offer.start_at).getTime();
    const end = new Date(offer.end_at).getTime();
    if (Number.isFinite(end) && end <= now) return "Expired";
    if (Number.isFinite(start) && start > now) return "Scheduled";
    if (Number.isFinite(start) && Number.isFinite(end) && start <= now && end > now) return "Live";
    return offer.status || "Scheduled";
}

function getDiscountText(offer) {
    if (offer.discount_type === "PERCENTAGE") return `${offer.discount_value}% OFF`;
    return `₹${offer.discount_value} OFF`;
}

function getOfferImage(offer) {
    if (!offer?.image_url) return "";
    return offer.image_url.startsWith("http") ? offer.image_url : `${API_ORIGIN}${offer.image_url}`;
}

function TemplateArtwork({ template, imageUrl, title, discount, shopName }) {
    return (
        <div className={`offer-artwork offer-artwork--${template?.tone || "editorial"}`}>
            {imageUrl ? <img className="offer-artwork__photo" src={imageUrl} alt="" /> : null}
            <div className="offer-artwork__shade" />
            <span className="offer-artwork__eyebrow">{shopName || "YOUR RESTAURANT"}</span>
            <div className="offer-artwork__copy">
                <span className="offer-artwork__kicker">A SPECIAL TREAT FOR YOU</span>
                <strong>{title || "Your next favourite offer"}</strong>
                <span className="offer-artwork__discount">{discount || "25% OFF"}</span>
            </div>
            <span className="offer-artwork__stamp">FOODLY<br />SPECIAL</span>
        </div>
    );
}

function OfferStatus({ status }) {
    return <span className={`offer-status-badge offer-status-badge--${status.toLowerCase()}`}>{status}</span>;
}

function SummaryCard({ icon, label, value, variant }) {
    return (
        <div className="offer-summary-card">
            <span className={`offer-summary-icon offer-summary-icon--${variant}`}>{icon}</span>
            <div>
                <strong>{value}</strong>
                <span>{label}</span>
            </div>
        </div>
    );
}

function OfferCard({ offer, menuItems, selected, onSelect, onEdit, onToggle, onDelete }) {
    const status = getOfferStatus(offer);
    const image = getOfferImage(offer);
    const itemCount = offer.items?.length ?? offer.item_ids?.length ?? 0;
    return (
        <article className={`offer-management-card ${selected ? "is-selected" : ""}`} onClick={() => onSelect(offer)}>
            <div className="offer-card-image">
                {image ? <img src={image} alt={offer.title || "Offer"} /> : (
                    <TemplateArtwork
                        template={TEMPLATES[0]}
                        title={offer.title}
                        discount={getDiscountText(offer)}
                    />
                )}
            </div>
            <div className="offer-card-main">
                <div className="offer-card-title-line">
                    <h3>{offer.title}</h3>
                    <OfferStatus status={status} />
                </div>
                <p className="offer-card-description">{offer.description || "A special offer for your customers."}</p>
                <div className="offer-card-meta">
                    <span className="offer-meta-discount">✦ {getDiscountText(offer)}</span>
                    <span>♧ {itemCount} {itemCount === 1 ? "item" : "items"}</span>
                    <span>◷ {new Date(offer.start_at).toLocaleDateString()} – {new Date(offer.end_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="offer-card-actions" onClick={(event) => event.stopPropagation()}>
                <button className="offer-icon-button" title="Edit offer" onClick={() => onEdit(offer)}>✎</button>
                <button
                    className={`offer-toggle ${offer.is_active ? "is-on" : ""}`}
                    title={offer.is_active ? "Deactivate offer" : "Activate offer"}
                    onClick={() => onToggle(offer)}
                    aria-label={offer.is_active ? "Deactivate offer" : "Activate offer"}
                ><span /></button>
                <button className="offer-icon-button offer-icon-button--danger" title="Delete offer" onClick={() => onDelete(offer)}>⋯</button>
            </div>
        </article>
    );
}

function ShopOffers() {
    const [offers, setOffers] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [error, setError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All Offers");
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [studioOpen, setStudioOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [offerImage, setOfferImage] = useState(null);
    const [existingImage, setExistingImage] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        loadOffers();
        loadMenuItems();
    }, []);

    async function loadOffers() {
        try {
            setLoading(true);
            setError("");
            const data = await apiFetch("/shop/offers");
            setOffers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to load offers.");
        } finally {
            setLoading(false);
        }
    }

    async function loadMenuItems() {
        try {
            setLoadingItems(true);
            const data = await apiFetch("/menu/categories/item");
            setMenuItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Unable to load menu items:", err);
        } finally {
            setLoadingItems(false);
        }
    }

    const counts = useMemo(() => {
        const result = { total: offers.length, live: 0, scheduled: 0, expired: 0, inactive: 0 };
        offers.forEach((offer) => {
            const status = getOfferStatus(offer).toLowerCase();
            if (status === "live") result.live += 1;
            else if (status === "scheduled") result.scheduled += 1;
            else if (status === "expired") result.expired += 1;
            else result.inactive += 1;
        });
        return result;
    }, [offers]);

    const filteredOffers = useMemo(() => offers.filter((offer) => {
        const status = getOfferStatus(offer);
        const matchesFilter = activeFilter === "All Offers" || status === activeFilter;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || `${offer.title || ""} ${offer.description || ""}`.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    }), [offers, activeFilter, search]);

    const selectedOffer = offers.find((offer) => offer.offer_id === selectedOfferId) || null;

    function startCreate() {
        setEditingOffer(null);
        setForm({ ...EMPTY_FORM });
        setSelectedTemplate(TEMPLATES[0]);
        setOfferImage(null);
        setExistingImage("");
        setSaveError("");
        setStudioOpen(true);
    }

    function startEdit(offer) {
        setEditingOffer(offer);
        setForm({
            title: offer.title || "",
            description: offer.description || "",
            discount_type: offer.discount_type || "PERCENTAGE",
            discount_value: String(offer.discount_value ?? ""),
            start_at: toLocalDateTime(offer.start_at),
            end_at: toLocalDateTime(offer.end_at),
            is_active: Boolean(offer.is_active),
            item_ids: offer.items?.map((item) => item.item_id) || offer.item_ids || [],
        });
        const savedTemplate = TEMPLATES.find((template) => template.id === offer.template_id) || TEMPLATES[0];
        setSelectedTemplate(savedTemplate);
        setOfferImage(null);
        setExistingImage(getOfferImage(offer));
        setSaveError("");
        setStudioOpen(true);
    }

    function closeStudio() {
        if (saving) return;
        setStudioOpen(false);
        setEditingOffer(null);
        setOfferImage(null);
        setSaveError("");
    }

    function calculateOfferPrice(item) {
        const price = Number(item.price);
        const value = Number(form.discount_value);
        if (!value || value <= 0) return price;
        if (form.discount_type === "PERCENTAGE") return Math.max(0, Math.round((price - price * value / 100) * 100) / 100);
        // Existing API semantics: FIXED_PRICE is the final offer price, not an amount deducted.
        return Math.max(0, Math.min(price, value));
    }

    async function saveOffer(event) {
        event.preventDefault();
        setSaveError("");
        if (!form.title.trim()) return setSaveError("Please enter an offer title.");
        if (!form.discount_value || Number(form.discount_value) <= 0) return setSaveError("Enter a discount greater than zero.");
        if (form.discount_type === "PERCENTAGE" && Number(form.discount_value) > 100) return setSaveError("Percentage discount cannot exceed 100%.");
        if (!form.start_at || !form.end_at) return setSaveError("Choose both start and end dates.");
        if (new Date(form.end_at) <= new Date(form.start_at)) return setSaveError("The end date must be after the start date.");

        try {
            setSaving(true);
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

            // Template metadata is sent only after the backend schema supports it.
            // This keeps the existing offer endpoint compatible during the UI redesign.
            const saved = editingOffer
                ? await apiFetch(`/shop/offers/${editingOffer.offer_id}`, { method: "PUT", body: JSON.stringify(payload) })
                : await apiFetch("/shop/offers", { method: "POST", body: JSON.stringify(payload) });

            let finalOffer = saved;
            if (offerImage) {
                const data = new FormData();
                data.append("image", offerImage);
                finalOffer = await apiFetch(`/shop/offers/${saved.offer_id}/image`, { method: "POST", body: data });
            } else if (existingImage && !saved.image_url && editingOffer) {
                finalOffer = { ...saved, image_url: editingOffer.image_url };
            }

            setOffers((previous) => editingOffer
                ? previous.map((offer) => offer.offer_id === finalOffer.offer_id ? finalOffer : offer)
                : [...previous, finalOffer]);
            setSelectedOfferId(finalOffer.offer_id);
            setStudioOpen(false);
            setEditingOffer(null);
            setOfferImage(null);
        } catch (err) {
            setSaveError(err.message || "Unable to save this offer.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleOffer(offer) {
        try {
            const updated = await apiFetch(`/shop/offers/${offer.offer_id}`, {
                method: "PUT",
                body: JSON.stringify({ is_active: !offer.is_active }),
            });
            setOffers((previous) => previous.map((item) => item.offer_id === updated.offer_id ? updated : item));
        } catch (err) {
            setError(err.message || "Unable to update offer status.");
        }
    }

    async function deleteOffer(offer) {
        if (!window.confirm(`Delete "${offer.title}"? This cannot be undone.`)) return;
        try {
            await apiFetch(`/shop/offers/${offer.offer_id}`, { method: "DELETE" });
            setOffers((previous) => previous.filter((item) => item.offer_id !== offer.offer_id));
            if (selectedOfferId === offer.offer_id) setSelectedOfferId(null);
        } catch (err) {
            setError(err.message || "Unable to delete offer.");
        }
    }

    const previewImage = offerImage ? URL.createObjectURL(offerImage) : existingImage;

    if (loading) {
        return <main className="shop-page"><div className="offers-page-shell"><div className="offers-loading">Loading your offers…</div></div></main>;
    }

    return (
        <main className="shop-page offers-page">
            <div className="offers-page-shell">
                <header className="offers-page-heading">
                    <div>
                        <span className="offers-eyebrow">GROW YOUR RESTAURANT</span>
                        <h1>Offers Management</h1>
                        <p>Create and manage attractive offers to bring more customers to your restaurant.</p>
                    </div>
                    <button className="offers-primary-button" onClick={startCreate}>＋ <span>Create New Offer</span></button>
                </header>

                {error && <div className="offers-alert" role="alert">{error}<button onClick={() => setError("")}>Dismiss</button></div>}

                <section className="offers-summary-grid" aria-label="Offer summary">
                    <SummaryCard icon="✦" label="Total Offers" value={counts.total} variant="gold" />
                    <SummaryCard icon="▶" label="Live Offers" value={counts.live} variant="green" />
                    <SummaryCard icon="▦" label="Scheduled" value={counts.scheduled} variant="blue" />
                    <SummaryCard icon="◷" label="Expired" value={counts.expired} variant="gray" />
                    <SummaryCard icon="Ⅱ" label="Inactive" value={counts.inactive} variant="red" />
                </section>

                <section className="offers-workspace">
                    <div className="offers-list-column">
                        <div className="offers-list-toolbar">
                            <div className="offers-filter-tabs">
                                {["All Offers", "Live", "Scheduled", "Expired", "Inactive"].map((filter) => (
                                    <button key={filter} className={activeFilter === filter ? "is-active" : ""} onClick={() => setActiveFilter(filter)}>{filter}</button>
                                ))}
                            </div>
                            <label className="offers-search">
                                <span>⌕</span>
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offers…" />
                            </label>
                        </div>

                        <div className="offers-list">
                            {filteredOffers.length ? filteredOffers.map((offer) => (
                                <OfferCard
                                    key={offer.offer_id}
                                    offer={offer}
                                    menuItems={menuItems}
                                    selected={selectedOfferId === offer.offer_id}
                                    onSelect={(item) => setSelectedOfferId(item.offer_id)}
                                    onEdit={startEdit}
                                    onToggle={toggleOffer}
                                    onDelete={deleteOffer}
                                />
                            )) : (
                                <div className="offers-empty-state">
                                    <span>✦</span>
                                    <h3>{offers.length ? "No offers match these filters" : "Your first offer starts here"}</h3>
                                    <p>{offers.length ? "Try another status or search term." : "Create an offer to give customers another reason to order."}</p>
                                    {!offers.length && <button className="offers-primary-button" onClick={startCreate}>＋ Create New Offer</button>}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="offers-studio-panel">
                        {studioOpen ? (
                            <form onSubmit={saveOffer} className="offers-studio-form">
                                <div className="offers-panel-heading">
                                    <div><span className="offers-eyebrow">OFFER STUDIO</span><h2>{editingOffer ? "Edit Offer" : "Create New Offer"}</h2></div>
                                    <button type="button" className="offers-close-button" onClick={closeStudio} aria-label="Close editor">×</button>
                                </div>
                                <div className="offers-stepper">
                                    <span className="is-current"><b>1</b> Template</span><i /><span><b>2</b> Design</span><i /><span><b>3</b> Offer Details</span>
                                </div>

                                <section className="offers-editor-section">
                                    <div className="offers-section-title"><span>1</span><div><h3>Choose a Template</h3><p>Select a design direction for your offer banner.</p></div></div>
                                    <div className="offers-template-grid">
                                        {TEMPLATES.map((template) => (
                                            <button type="button" key={template.id} className={`offers-template-choice ${selectedTemplate.id === template.id ? "is-selected" : ""}`} onClick={() => setSelectedTemplate(template)}>
                                                <div className={`offers-template-swatch offers-template-swatch--${template.tone}`}>
                                                    <span>{template.name === "Editorial Pop" ? "BURNO" : template.name === "Premium Feast" ? "PREMIUM FEAST" : template.name === "Sweet & Playful" ? "Sweet Treats" : "URBAN CRAVE"}</span>
                                                    <b>{form.discount_value ? `${form.discount_value}${form.discount_type === "PERCENTAGE" ? "%" : "₹"}` : "25%"} OFF</b>
                                                </div>
                                                <strong>{template.name}</strong>
                                                <small>{template.subtitle}</small>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="offers-editor-section">
                                    <div className="offers-section-title"><span>2</span><div><h3>Design Preview</h3><p>Preview the banner direction. Detailed visual customization is next.</p></div></div>
                                    <TemplateArtwork template={selectedTemplate} imageUrl={previewImage} title={form.title} discount={form.discount_value ? `${form.discount_value}${form.discount_type === "PERCENTAGE" ? "%" : "₹"} OFF` : "25% OFF"} />
                                    <label className="offers-upload-button">＋ Upload banner image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setOfferImage(event.target.files?.[0] || null)} /></label>
                                    <p className="offers-field-help">JPG, PNG or WebP. Keep the file under 5 MB.</p>
                                </section>

                                <section className="offers-editor-section">
                                    <div className="offers-section-title"><span>3</span><div><h3>Offer Details</h3><p>Set the discount, dates, and eligible menu items.</p></div></div>
                                    <div className="offers-form-grid">
                                        <label className="offers-field offers-field--full">Offer Title <em>*</em>
                                            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Weekend Special" maxLength={100} required />
                                        </label>
                                        <label className="offers-field">Discount Type
                                            <select value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value })}>
                                                <option value="PERCENTAGE">Percentage</option><option value="FIXED_PRICE">Fixed amount (₹)</option>
                                            </select>
                                        </label>
                                        <label className="offers-field">Discount Value <em>*</em>
                                            <div className="offers-input-suffix"><input type="number" min="0.01" max={form.discount_type === "PERCENTAGE" ? "100" : undefined} step="0.01" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} placeholder="25" required /><span>{form.discount_type === "PERCENTAGE" ? "% OFF" : "₹ OFF"}</span></div>
                                        </label>
                                        <label className="offers-field">Valid From <em>*</em><input type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} required /></label>
                                        <label className="offers-field">Valid To <em>*</em><input type="datetime-local" value={form.end_at} onChange={(event) => setForm({ ...form, end_at: event.target.value })} required /></label>
                                        <label className="offers-field offers-field--full">Description
                                            <textarea rows="3" maxLength={200} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell customers what makes this offer special." />
                                            <small className="offers-character-count">{form.description.length}/200</small>
                                        </label>
                                    </div>
                                    <div className="offers-menu-picker">
                                        <div className="offers-menu-picker-heading"><strong>Applicable Menu Items <em>*</em></strong><span>{form.item_ids.length} selected</span></div>
                                        {loadingItems ? <p>Loading menu items…</p> : menuItems.length ? (
                                            <div className="offers-menu-items">
                                                {menuItems.map((item) => {
                                                    const id = item.item_id;
                                                    const checked = form.item_ids.includes(id);
                                                    return <label key={id} className={checked ? "is-selected" : ""}>
                                                        <input type="checkbox" checked={checked} onChange={() => setForm((previous) => ({ ...previous, item_ids: checked ? previous.item_ids.filter((value) => value !== id) : [...previous.item_ids, id] }))} />
                                                        <span className="offers-menu-item-name">{item.item_name || item.name}</span>
                                                        <span className="offers-menu-item-price">₹{Number(item.price || 0).toFixed(0)}</span>
                                                        {checked && <small>Offer ₹{calculateOfferPrice(item).toFixed(0)}</small>}
                                                    </label>;
                                                })}
                                            </div>
                                        ) : <p>No menu items found for this restaurant.</p>}
                                    </div>
                                    <label className="offers-active-control"><span><strong>Offer active</strong><small>Customers can see this offer during its validity.</small></span><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /></label>
                                </section>

                                {saveError && <div className="offers-alert" role="alert">{saveError}</div>}
                                <div className="offers-studio-actions">
                                    <button type="button" className="offers-secondary-button" onClick={closeStudio}>Cancel</button>
                                    <button type="submit" className="offers-primary-button" disabled={saving}>{saving ? "Saving…" : editingOffer ? "Save Changes →" : "Create Offer →"}</button>
                                </div>
                            </form>
                        ) : selectedOffer ? (
                            <div className="offers-selected-detail">
                                <div className="offers-panel-heading">
                                    <div><span className="offers-eyebrow">OFFER DETAILS</span><h2>{selectedOffer.title}</h2></div>
                                    <button className="offers-close-button" onClick={() => setSelectedOfferId(null)} aria-label="Clear selection">×</button>
                                </div>
                                {getOfferImage(selectedOffer) ? <img className="offers-selected-banner" src={getOfferImage(selectedOffer)} alt={selectedOffer.title} /> : <TemplateArtwork template={TEMPLATES[0]} title={selectedOffer.title} discount={getDiscountText(selectedOffer)} />}
                                <div className="offers-selected-summary"><OfferStatus status={getOfferStatus(selectedOffer)} /><strong>{getDiscountText(selectedOffer)}</strong></div>
                                <p>{selectedOffer.description || "No description provided."}</p>
                                <div className="offers-detail-dates"><div><span>Valid from</span><strong>{new Date(selectedOffer.start_at).toLocaleString()}</strong></div><div><span>Valid to</span><strong>{new Date(selectedOffer.end_at).toLocaleString()}</strong></div></div>
                                <h3>Eligible menu items</h3>
                                <div className="offers-detail-item-list">{selectedOffer.items?.length ? selectedOffer.items.map((item) => <span key={item.item_id}>{item.item_name}</span>) : <p>No item details returned by the API.</p>}</div>
                                <button className="offers-primary-button offers-detail-edit" onClick={() => startEdit(selectedOffer)}>✎ Edit Offer</button>
                            </div>
                        ) : (
                            <div className="offers-studio-empty">
                                <span className="offers-studio-empty-icon">✦</span>
                                <span className="offers-eyebrow">OFFER STUDIO</span>
                                <h2>Create something worth sharing.</h2>
                                <p>Choose a template, add your offer details, and prepare a promotion for your customers.</p>
                                <div className="offers-mini-template-row">{TEMPLATES.map((template) => <div key={template.id} className={`offers-mini-template offers-mini-template--${template.tone}`}><span>{template.name}</span></div>)}</div>
                                <button className="offers-primary-button" onClick={startCreate}>＋ Create New Offer</button>
                            </div>
                        )}
                    </aside>
                </section>
            </div>
        </main>
    );
}

export default ShopOffers;
