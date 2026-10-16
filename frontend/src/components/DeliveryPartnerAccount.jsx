import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import "../styles/DeliveryPartnerAccount.css";

function DeliveryPartnerAccount() {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({
        full_name: "",
        phone_number: "",
        address: "",
        vehicle_type: "",
        vehicle_number: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Load delivery partner profile
    async function loadProfile() {
        setLoading(true);
        setError("");

        try {
            const data = await apiFetch("/delivery-partner/profile");

            setProfile(data);

            setProfileForm({
                full_name: data.full_name ?? "",
                phone_number: data.phone_number ?? "",
                address: data.address ?? "",
                vehicle_type: data.vehicle_type ?? "",
                vehicle_number: data.vehicle_number ?? "",
            });
        } catch (err) {
            setError(
                err.data?.detail ||
                    err.message ||
                    "Unable to load your account information."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    // Update form fields
    function handleChange(event) {
        const { name, value } = event.target;

        setProfileForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // Enter edit mode
    function handleEdit() {
        setProfileForm({
            full_name: profile.full_name ?? "",
            phone_number: profile.phone_number ?? "",
            address: profile.address ?? "",
            vehicle_type: profile.vehicle_type ?? "",
            vehicle_number: profile.vehicle_number ?? "",
        });

        setError("");
        setSuccess("");
        setIsEditing(true);
    }

    // Cancel editing and discard unsaved changes
    function handleCancel() {
        setProfileForm({
            full_name: profile.full_name ?? "",
            phone_number: profile.phone_number ?? "",
            address: profile.address ?? "",
            vehicle_type: profile.vehicle_type ?? "",
            vehicle_number: profile.vehicle_number ?? "",
        });

        setIsEditing(false);
        setError("");
        setSuccess("");
    }

    // Save profile changes
    async function handleSave() {
        setError("");
        setSuccess("");

        const editableFields = [
            "full_name",
            "phone_number",
            "address",
            "vehicle_type",
            "vehicle_number",
        ];

        const payload = {};

        for (const field of editableFields) {
            const newValue = profileForm[field].trim();
            const oldValue = (profile[field] ?? "").trim();

            if (newValue !== oldValue) {
                if (!newValue) {
                    setError(
                        `${field
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (letter) =>
                                letter.toUpperCase()
                            )} cannot be blank.`
                    );
                    return;
                }

                payload[field] = newValue;
            }
        }

        if (Object.keys(payload).length === 0) {
            setSuccess("No changes were made.");
            setIsEditing(false);
            return;
        }

        setSaving(true);

        try {
            const response = await apiFetch(
                "/delivery-partner/profile",
                {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                }
            );

            // Update the displayed profile using the saved values
            setProfile((previous) => ({
                ...previous,
                ...payload,
                ...(response &&
                typeof response === "object"
                    ? response
                    : {}),
            }));

            setIsEditing(false);
            setSuccess("Profile updated successfully.");
        } catch (err) {
            setError(
                err.data?.detail ||
                    err.message ||
                    "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    }

    function getValue(value) {
        return value || "Not provided";
    }

    const partnerName =
        profile?.full_name ||
        user?.full_name ||
        user?.name ||
        "Delivery Partner";

    if (loading) {
        return (
            <section className="dp-account-page">
                <div className="dp-account-message">
                    Loading account information...
                </div>
            </section>
        );
    }

    if (!profile) {
        return (
            <section className="dp-account-page">
                <div className="dp-account-message dp-account-error">
                    <p>{error || "Unable to load your profile."}</p>

                    <button
                        type="button"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="dp-account-page">
            {/* Page Header */}
            <header className="dp-account-header">
                <div>
                    <h1>My Account</h1>
                    <p>
                        Manage your personal and vehicle information.
                    </p>
                </div>
            </header>

            {/* Success and Error Messages */}
            {error && (
                <div
                    className="dp-account-feedback error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="dp-account-feedback success"
                    role="status"
                >
                    {success}
                </div>
            )}

            {/* Profile Summary */}
            <div className="dp-account-profile-card">
                <div className="dp-account-avatar">
                    {partnerName.charAt(0).toUpperCase()}
                </div>

                <div className="dp-account-profile-info">
                    <h2>{partnerName}</h2>

                    <p>Delivery Partner</p>

                    <span
                        className={`dp-account-status ${
                            profile.is_online ? "online" : "offline"
                        }`}
                    >
                        {profile.is_online ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            {/* Information Cards */}
            <div className="dp-account-grid">
                {/* Personal Information */}
                <article className="dp-account-card">
                    <div className="dp-account-card-heading">
                        <span>👤</span>

                        <div>
                            <h2>Personal Information</h2>
                            <p>Keep your personal details up to date.</p>
                        </div>
                    </div>

                    <div className="dp-account-details">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="dp-full-name">
                                Full Name
                            </label>

                            {isEditing ? (
                                <input
                                    id="dp-full-name"
                                    type="text"
                                    name="full_name"
                                    value={profileForm.full_name}
                                    onChange={handleChange}
                                    disabled={saving}
                                    autoComplete="name"
                                />
                            ) : (
                                <strong>
                                    {getValue(profile.full_name)}
                                </strong>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="dp-phone-number">
                                Phone Number
                            </label>

                            {isEditing ? (
                                <input
                                    id="dp-phone-number"
                                    type="tel"
                                    name="phone_number"
                                    value={profileForm.phone_number}
                                    onChange={handleChange}
                                    disabled={saving}
                                    autoComplete="tel"
                                />
                            ) : (
                                <strong>
                                    {getValue(profile.phone_number)}
                                </strong>
                            )}
                        </div>

                        {/* Address */}
                        <div>
                            <label htmlFor="dp-address">
                                Address
                            </label>

                            {isEditing ? (
                                <textarea
                                    id="dp-address"
                                    name="address"
                                    value={profileForm.address}
                                    onChange={handleChange}
                                    disabled={saving}
                                    rows={3}
                                    autoComplete="street-address"
                                />
                            ) : (
                                <strong>
                                    {getValue(profile.address)}
                                </strong>
                            )}
                        </div>
                    </div>

                    {/* Personal Information Actions */}
                    {isEditing && (
                        <div className="dp-account-form-actions">
                            <button
                                type="button"
                                className="dp-account-cancel-button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="dp-account-save-button"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                    {/* Edit Profile Button */}
            {!isEditing && (
                <div className="dp-account-bottom-actions">
                    <button
                        type="button"
                        className="dp-account-edit-button"
                        onClick={handleEdit}
                    >
                        Edit Profile
                    </button>
                </div>
            )}
                </article>

                {/* Vehicle Information */}
                <article className="dp-account-card">
                    <div className="dp-account-card-heading">
                        <span>🛵</span>

                        <div>
                            <h2>Vehicle Information</h2>
                            <p>Manage your delivery vehicle details.</p>
                        </div>
                    </div>

                    <div className="dp-account-details">
                        {/* Vehicle Type */}
                        <div>
                            <label htmlFor="dp-vehicle-type">
                                Vehicle Type
                            </label>

                            {isEditing ? (
                                <select
                                    id="dp-vehicle-type"
                                    name="vehicle_type"
                                    value={profileForm.vehicle_type}
                                    onChange={handleChange}
                                    disabled={saving}
                                >
                                    <option value="">
                                        Select vehicle type
                                    </option>

                                    <option value="Bike">Bike</option>
                                    <option value="Scooter">Scooter</option>
                                    <option value="Electric Bike">
                                        Electric Bike
                                    </option>
                                    <option value="Cycle">Cycle</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <strong>
                                    {getValue(profile.vehicle_type)}
                                </strong>
                            )}
                        </div>

                        {/* Vehicle Registration */}
                        <div>
                            <label htmlFor="dp-vehicle-number">
                                Vehicle Registration Number
                            </label>

                            {isEditing ? (
                                <input
                                    id="dp-vehicle-number"
                                    type="text"
                                    name="vehicle_number"
                                    value={profileForm.vehicle_number}
                                    onChange={handleChange}
                                    disabled={saving}
                                    autoComplete="off"
                                />
                            ) : (
                                <strong>
                                    {getValue(profile.vehicle_number)}
                                </strong>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Information Actions */}
                    {!isEditing && (
                        <div className="dp-account-form-actions">
                            <button
                                type="button"
                                className="dp-account-edit-button"
                                onClick={handleEdit}
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}

                    {isEditing && (
                        <div className="dp-account-form-actions">
                            <button
                                type="button"
                                className="dp-account-cancel-button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="dp-account-save-button"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </article>
            </div>

            {/* Approval Status */}
            <div className="dp-account-status-card">
                <div>
                    <h3>Account Approval Status</h3>
                    <p>
                        Your current delivery partner account status.
                    </p>
                </div>

                <span
                    className={`dp-account-approval ${
                        profile.status?.toLowerCase() || "unknown"
                    }`}
                >
                    {profile.status || "Unknown"}
                </span>
            </div>

            
        </section>
    );
}

export default DeliveryPartnerAccount;