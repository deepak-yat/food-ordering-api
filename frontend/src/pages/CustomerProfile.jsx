import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    useCustomer,
    useCustomerProfile,
    useCurrentLocationAddress,
} from "../context/CustomerContext";
import "../styles/CustomerProfile.css";
function Icon({ type, size = 22 }) {


    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    const icons = {
        profile: (
            <svg {...common}>
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6" />
            </svg>
        ),

        location: (
            <svg {...common}>
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </svg>
        ),

        orders: (
            <svg {...common}>
                <path d="M6 3h12v18H6z" />
                <path d="M9 7h6M9 11h6M9 15h4" />
            </svg>
        ),

        card: (
            <svg {...common}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M7 15h4" />
            </svg>
        ),

        notification: (
            <svg {...common}>
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
            </svg>
        ),

        settings: (
            <svg {...common}>
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                <path d="M3 13v-2l2.1-.7a7.8 7.8 0 0 1 .8-1.8L5 6.6l1.4-1.4 1.9 1a7.8 7.8 0 0 1 1.8-.8L11 3h2l.7 2.4a7.8 7.8 0 0 1 1.8.8l1.9-1 1.4 1.4-1 1.9a7.8 7.8 0 0 1 .8 1.8L21 11v2l-2.4.7a7.8 7.8 0 0 1-.8 1.8l1 1.9-1.4 1.4-1.9-1a7.8 7.8 0 0 1-1.8.8L13 21h-2l-.7-2.4a7.8 7.8 0 0 1-1.8-.8l-1.9 1-1.4-1.4 1-1.9a7.8 7.8 0 0 1-.8-1.8L3 13Z" />
            </svg>
        ),

        edit: (
            <svg {...common}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
        ),

        plus: (
            <svg {...common}>
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),

        home: (
            <svg {...common}>
                <path d="m3 11 9-8 9 8" />
                <path d="M5 10v10h14V10M9 20v-6h6v6" />
            </svg>
        ),

        building: (
            <svg {...common}>
                <path d="M5 21V4h14v17M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2M3 21h18" />
            </svg>
        ),

        trash: (
            <svg {...common}>
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
            </svg>
        ),

        camera: (
            <svg {...common}>
                <path d="M4 7h3l1.5-2h7L17 7h3v12H4Z" />
                <circle cx="12" cy="13" r="3" />
            </svg>
        ),

        lock: (
            <svg {...common}>
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
        ),

        help: (
            <svg {...common}>
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.3.8-1.5 1.3-1.5 2.5M12 17h.01" />
            </svg>
        ),

        book: (
            <svg {...common}>
                <path d="M4 5a3 3 0 0 1 3-2h13v17H7a3 3 0 0 0-3 3Z" />
                <path d="M7 3v17" />
            </svg>
        ),

        headset: (
            <svg {...common}>
                <path d="M4 13a8 8 0 0 1 16 0" />
                <path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2ZM20 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" />
            </svg>
        ),

        shield: (
            <svg {...common}>
                <path d="M12 3 20 6v6c0 5-3.3 8-8 9-4.7-1-8-4-8-9V6Z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        ),

        arrow: (
            <svg {...common}>
                <path d="m9 18 6-6-6-6" />
            </svg>
        ),
    };

    return icons[type] || null;
}


function CustomerProfile() {
    const { user } = useAuth();

const {
    profile,
    profileLoading,
    profileSaving,
    profileError,
    updateProfile,
} = useCustomerProfile();
const {
    addresses,
    addressLoading,
    loadAddresses,
    saveAddress,
    updateAddress,
    deleteAddress
} = useCustomer();
const {
    locationLoading,
    locationError,
    getCurrentLocation,
} = useCurrentLocationAddress();
const [isEditingProfile, setIsEditingProfile] = useState(false);

const [profileForm, setProfileForm] = useState({
    customer_name: "",
    phone: "",
});
const [showAddAddressForm, setShowAddAddressForm] = useState(false);

const [addressForm, setAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
    latitude: null,
    longitude: null,
});

const [addressFormError, setAddressFormError] = useState("");
const [editingAddressId, setEditingAddressId] = useState(null);

const [editAddressForm, setEditAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
    latitude: null,
    longitude: null,
});

const [editAddressError, setEditAddressError] = useState("");
useEffect(() => {
    if (profile) {
        setProfileForm({
            customer_name: profile.customer_name || "",
            phone: profile.phone || "",
        });
    }
}, [profile]);
useEffect(() => {
    loadAddresses();
}, []);
function handleProfileEdit() {
    if (!profile) {
        return;
    }

    setProfileForm({
        customer_name: profile.customer_name || "",
        phone: profile.phone || "",
    });

    setIsEditingProfile(true);
}

function handleProfileCancel() {
    setProfileForm({
        customer_name: profile?.customer_name || "",
        phone: profile?.phone || "",
    });

    setIsEditingProfile(false);
}

async function handleProfileSave(event) {
    event.preventDefault();

    const customerName = profileForm.customer_name.trim();
    const phone = profileForm.phone.trim();

    if (!customerName) {
        return;
    }

    const updatedProfile = await updateProfile({
        customer_name: customerName,
        phone,
    });

    if (updatedProfile) {
        setIsEditingProfile(false);
    }
}
async function handleUseCurrentLocation() {
    setAddressFormError("");

    const location = await getCurrentLocation();

    if (!location) {
        return;
    }

    setAddressForm((previous) => ({
        ...previous,
        address_line1: location.address_line1 || "",
        address_line2: location.address_line2 || "",
        city: location.city || "",
        state: location.state || "",
        pincode: location.pincode || "",
        latitude: location.latitude,
        longitude: location.longitude,
    }));
}
async function handleSaveAddress() {
    setAddressFormError("");

    if (!addressForm.address_line1.trim()) {
        setAddressFormError("Address Line 1 is required.");
        return;
    }

    if (!addressForm.city.trim()) {
        setAddressFormError("City is required.");
        return;
    }

    if (!addressForm.state.trim()) {
        setAddressFormError("State is required.");
        return;
    }

    if (!addressForm.pincode.trim()) {
        setAddressFormError("Pincode is required.");
        return;
    }

    const createdAddress = await saveAddress({
        ...addressForm,
        address_line1: addressForm.address_line1.trim(),
        address_line2: addressForm.address_line2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
    });

    if (createdAddress) {
        setAddressForm({
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            pincode: "",
            is_default: false,
            latitude: null,
            longitude: null,
        });

        setAddressFormError("");
        setShowAddAddressForm(false);
    }
}

function handleEditAddress(address) {
    setShowAddAddressForm(false);

    setEditAddressError("");

    setEditAddressForm({
        address_line1: address.address_line1 || "",
        address_line2: address.address_line2 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        is_default: Boolean(address.is_default),
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,
    });

    setEditingAddressId(address.address_id);
}

async function handleUpdateAddress(addressId) {
    setEditAddressError("");

    if (!editAddressForm.address_line1.trim()) {
        setEditAddressError("Address Line 1 is required.");
        return;
    }

    if (!editAddressForm.city.trim()) {
        setEditAddressError("City is required.");
        return;
    }

    if (!editAddressForm.state.trim()) {
        setEditAddressError("State is required.");
        return;
    }

    if (!editAddressForm.pincode.trim()) {
        setEditAddressError("Pincode is required.");
        return;
    }

    const updatedAddress = await updateAddress(addressId, {
        ...editAddressForm,
        address_line1: editAddressForm.address_line1.trim(),
        address_line2: editAddressForm.address_line2.trim(),
        city: editAddressForm.city.trim(),
        state: editAddressForm.state.trim(),
        pincode: editAddressForm.pincode.trim(),
    });

    if (updatedAddress) {
        setEditingAddressId(null);
        setEditAddressError("");
    }
}

async function handleDeleteAddress(addressId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
        return;
    }

    const deleted = await deleteAddress(addressId);

    if (deleted && editingAddressId === addressId) {
        setEditingAddressId(null);
        setEditAddressError("");
    }
}


async function handleMakeDefault(address) {
    const updatedAddress = await updateAddress(
        address.address_id,
        {
            is_default: true,
        }
    );

    if (!updatedAddress) {
        return;
    }
}

    return (
        <div className="customer-profile-page">

            {/* Banner */}
            <section >
                <div className="profile-banner">
                <img
    src="/profile-hero.png"
    alt="Foodly"
/>

                <div className="profile-banner-overlay">
                    <h1>Profile</h1>
                    <p>
                        Manage your account, addresses and preferences
                    </p>
                </div>
                </div>
            </section>


            {/* Main Layout */}
            <div className="profile-main-layout">

                {/* Sidebar */}
                <aside className="profile-sidebar">

                    <button className="profile-nav-item active">
                        <span className="profile-nav-icon">
                            <Icon type="profile" />
                        </span>
                        <span>Profile</span>
                    </button>

                    <button className="profile-nav-item">
                        <span className="profile-nav-icon">
                            <Icon type="location" />
                        </span>
                        <span>Addresses</span>
                    </button>

                    <button className="profile-nav-item">
                        <span className="profile-nav-icon">
                            <Icon type="orders" />
                        </span>
                        <span>Order History</span>
                    </button>

                    <button className="profile-nav-item">
                        <span className="profile-nav-icon">
                            <Icon type="card" />
                        </span>
                        <span>Payment Methods</span>
                    </button>

                    <button className="profile-nav-item">
                        <span className="profile-nav-icon">
                            <Icon type="notification" />
                        </span>
                        <span>Notifications</span>
                    </button>

                    <button className="profile-nav-item">
                        <span className="profile-nav-icon">
                            <Icon type="settings" />
                        </span>
                        <span>Settings</span>
                    </button>

                </aside>


                {/* Right Content */}
                <main className="profile-content">

                    {/* Profile Information */}
                    <section className="profile-section-card">

                        <div className="profile-section-header">

                            <div className="profile-section-title">
                                <div className="profile-title-icon">
                                    <Icon type="profile" size={21} />
                                </div>

                                <div>
                                    <h2>Profile Information</h2>
                                    <p>Keep your information up to date</p>
                                </div>
                            </div>

                           {isEditingProfile ? (
    <div className="profile-edit-actions">
        <button
            type="button"
            className="profile-cancel-button"
            onClick={handleProfileCancel}
            disabled={profileSaving}
        >
            Cancel
        </button>

        <button
            type="submit"
            form="profile-information-form"
            className="profile-primary-button"
            disabled={profileSaving}
        >
            <span>
                {profileSaving
                    ? "Saving..."
                    : "Save Changes"}
            </span>
        </button>
    </div>
) : (
    <button
        type="button"
        className="profile-primary-button"
        onClick={handleProfileEdit}
        disabled={profileLoading}
    >
        <Icon type="edit" size={17} />
        <span>Edit Profile</span>
    </button>
)}

                        </div>


                        <form
    id="profile-information-form"
    className="profile-information-body"
    onSubmit={handleProfileSave}
>
                            <div className="profile-avatar-wrapper">

                                <div className="profile-avatar">
                                    {(profile?.customer_name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()}
                                </div>

                                <button className="profile-camera-button">
                                    <Icon type="camera" size={16} />
                                </button>

                            </div>


                            <div className="profile-information-grid">

    <div className="profile-info-field">
        <span>Full Name</span>

        {isEditingProfile ? (
            <input
                type="text"
                value={profileForm.customer_name}
                onChange={(event) =>
                    setProfileForm((previous) => ({
                        ...previous,
                        customer_name: event.target.value,
                    }))
                }
                autoFocus
            />
        ) : (
            <strong>
                {profileLoading
                    ? "Loading..."
                    : profile?.customer_name || "—"}
            </strong>
        )}
    </div>


    <div className="profile-info-field">
        <span>Email</span>

        <strong>
            {user?.user_email || "—"}
        </strong>
    </div>


    <div className="profile-info-field">
        <span>Phone Number</span>

        {isEditingProfile ? (
            <input
                type="tel"
                value={profileForm.phone}
                onChange={(event) =>
                    setProfileForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                    }))
                }
            />
        ) : (
            <strong>
                {profileLoading
                    ? "Loading..."
                    : profile?.phone || "—"}
            </strong>
        )}
    </div>

</div>
{profileError && (
    <p className="profile-form-error">
        {profileError}
    </p>
)}

                        </form>

                    </section>


                    {/* Saved Addresses */}
                    <section className="profile-section-card addresses-card">

                        <div className="profile-section-header">

                            <div className="profile-section-title">
                                <div className="profile-title-icon">
                                    <Icon type="location" size={21} />
                                </div>

                                <div>
                                    <h2>Saved Addresses</h2>
                                    <p>Manage your delivery addresses</p>
                                </div>
                            </div>

                            <button
    type="button"
    className="profile-primary-button"
    onClick={() => {
        setAddressFormError("");
        setShowAddAddressForm(true);
    }}
>
    <Icon type="plus" size={18} />
    <span>Add Address</span>
</button>

                        </div>

{showAddAddressForm && (
    <div className="profile-address-form">
        <div className="profile-address-form-header">
            <div>
                <h3>Add New Address</h3>
                <p>Enter your delivery address</p>
            </div>

            <button
                type="button"
                className="profile-address-form-cancel"
                onClick={() => {
                    setShowAddAddressForm(false);
                    setAddressFormError("");
                }}
            >
                Cancel
            </button>
        </div>

        <div className="profile-address-form-grid">

            <div className="profile-address-form-field profile-address-form-field-full">
                <label>Address Line 1</label>
                <input
                    type="text"
                    value={addressForm.address_line1}
                    onChange={(event) =>
                        setAddressForm((previous) => ({
                            ...previous,
                            address_line1: event.target.value,
                        }))
                    }
                    placeholder="House / Building / Street"
                />
            </div>

            <div className="profile-address-form-field profile-address-form-field-full">
                <label>Address Line 2</label>
                <input
                    type="text"
                    value={addressForm.address_line2}
                    onChange={(event) =>
                        setAddressForm((previous) => ({
                            ...previous,
                            address_line2: event.target.value,
                        }))
                    }
                    placeholder="Apartment, landmark, etc. (optional)"
                />
            </div>

            <div className="profile-address-form-field">
                <label>City</label>
                <input
                    type="text"
                    value={addressForm.city}
                    onChange={(event) =>
                        setAddressForm((previous) => ({
                            ...previous,
                            city: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field">
                <label>State</label>
                <input
                    type="text"
                    value={addressForm.state}
                    onChange={(event) =>
                        setAddressForm((previous) => ({
                            ...previous,
                            state: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field">
                <label>Pincode</label>
                <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(event) =>
                        setAddressForm((previous) => ({
                            ...previous,
                            pincode: event.target.value,
                        }))
                    }
                />
            </div>

        </div>

        <button
            type="button"
            className="profile-current-location-button"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
        >
            <Icon type="location" size={17} />
            <span>
                {locationLoading
                    ? "Getting your location..."
                    : "Use My Current Location"}
            </span>
        </button>

        {locationError && (
            <p className="profile-form-error">
                {locationError}
            </p>
        )}

        {addressFormError && (
            <p className="profile-form-error">
                {addressFormError}
            </p>
        )}

        <label className="profile-default-address-option">
            <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={(event) =>
                    setAddressForm((previous) => ({
                        ...previous,
                        is_default: event.target.checked,
                    }))
                }
            />
            <span>Set as default address</span>
        </label>

        <div className="profile-address-form-actions">
            <button
                type="button"
                className="profile-address-form-cancel"
                onClick={() => {
                    setShowAddAddressForm(false);
                    setAddressFormError("");
                }}
            >
                Cancel
            </button>

            <button
    type="button"
    className="profile-primary-button"
    onClick={handleSaveAddress}
>
    Save Address
</button>
        </div>
    </div>
)}
                        <div className="address-list">

{addressLoading ? (
    <div className="profile-address-empty">
        Loading addresses...
    </div>
) : addresses.length === 0 ? (
    <div className="profile-address-empty">
        No saved addresses yet.
    </div>
) : (
    addresses.map((address) => (
        <div
            key={address.address_id}
            className="address-row"
        >
{editingAddressId === address.address_id ? (
    <div className="profile-address-edit-form">
        <div className="profile-address-form-header">
            <div>
                <h3>Edit Address</h3>
                <p>Update your delivery address</p>
            </div>

        </div>

        <div className="profile-address-form-grid">

            <div className="profile-address-form-field profile-address-form-field-full">
                <label>Address Line 1</label>
                <input
                    type="text"
                    value={editAddressForm.address_line1}
                    onChange={(event) =>
                        setEditAddressForm((previous) => ({
                            ...previous,
                            address_line1: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field profile-address-form-field-full">
                <label>Address Line 2</label>
                <input
                    type="text"
                    value={editAddressForm.address_line2}
                    onChange={(event) =>
                        setEditAddressForm((previous) => ({
                            ...previous,
                            address_line2: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field">
                <label>City</label>
                <input
                    type="text"
                    value={editAddressForm.city}
                    onChange={(event) =>
                        setEditAddressForm((previous) => ({
                            ...previous,
                            city: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field">
                <label>State</label>
                <input
                    type="text"
                    value={editAddressForm.state}
                    onChange={(event) =>
                        setEditAddressForm((previous) => ({
                            ...previous,
                            state: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="profile-address-form-field">
                <label>Pincode</label>
                <input
                    type="text"
                    value={editAddressForm.pincode}
                    onChange={(event) =>
                        setEditAddressForm((previous) => ({
                            ...previous,
                            pincode: event.target.value,
                        }))
                    }
                />
            </div>

        </div>

        {editAddressError && (
            <p className="profile-form-error">
                {editAddressError}
            </p>
        )}

        <div className="profile-address-form-actions">
            <button
                type="button"
                className="profile-address-form-cancel"
                onClick={() => {
                    setEditingAddressId(null);
                    setEditAddressError("");
                }}
            >
                Cancel
            </button>

            <button
    type="button"
    className="profile-primary-button"
    onClick={() => handleUpdateAddress(address.address_id)}
>
    Save Changes
</button>
        </div>
    </div>
) : (
    <>
        <div className="address-type-icon">
            <Icon type="location" size={22} />
        </div>

        <div className="address-details">
            <div className="address-name-row">
    <strong>Address</strong>

    {address.is_default ? (
        <span className="default-badge">
            Default
        </span>
    ) : (
        <button
            type="button"
            className="address-make-default-button"
            onClick={() => handleMakeDefault(address)}
        >
            Make Default
        </button>
    )}
</div>

            <p>
                {address.address_line1}

                {address.address_line2 && (
                    <>
                        <br />
                        {address.address_line2}
                    </>
                )}

                <br />
                {address.city}, {address.state}
                {address.pincode
                    ? ` - ${address.pincode}`
                    : ""}
            </p>
        </div>

        <div className="address-actions">
            <button
                type="button"
                className="address-edit-button"
                onClick={() => handleEditAddress(address)}
            >
                <Icon type="edit" size={17} />
                <span>Edit</span>
            </button>

            <div className="address-action-divider" />

            <button
    type="button"
    className="address-delete-button"
    onClick={() => handleDeleteAddress(address.address_id)}
>
    <Icon type="trash" size={17} />
    <span>Delete</span>
</button>
        </div>
    </>
)}
        </div>
    ))
)}

                        </div>

                    </section>


                    {/* Bottom Cards */}
                    <div className="profile-bottom-grid">

                        {/* Account Settings */}
                        <section className="profile-section-card bottom-card">

                            <div className="profile-section-title">
                                <div className="profile-title-icon">
                                    <Icon type="settings" size={21} />
                                </div>

                                <div>
                                    <h2>Account Settings</h2>
                                    <p>Manage your account preferences</p>
                                </div>
                            </div>

                            <div className="profile-settings-list">

                                <button
    type="button"
    className="profile-setting-row"
    onClick={() => {
        // temporary — we'll add the form next
    }}
>
    <span className="setting-row-left">
        <Icon type="lock" size={19} />
        <span>Change Password</span>
    </span>
    <Icon type="arrow" size={17} />
</button>

                                <button className="profile-setting-row">
                                    <span className="setting-row-left">
                                        <Icon type="notification" size={19} />
                                        <span>Notification Preferences</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                                <button className="profile-setting-row">
                                    <span className="setting-row-left">
                                        <Icon type="settings" size={19} />
                                        <span>Language</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                                <button className="profile-setting-row delete-setting">
                                    <span className="setting-row-left">
                                        <Icon type="trash" size={19} />
                                        <span>Delete Account</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                            </div>

                        </section>


                        {/* Help & Support */}
                        <section className="profile-section-card bottom-card">

                            <div className="profile-section-title">
                                <div className="profile-title-icon">
                                    <Icon type="help" size={21} />
                                </div>

                                <div>
                                    <h2>Help & Support</h2>
                                    <p>Need help with your account?</p>
                                </div>
                            </div>

                            <div className="profile-settings-list">

                                <button className="profile-setting-row">
                                    <span className="setting-row-left">
                                        <Icon type="book" size={19} />
                                        <span>FAQ</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                                <button className="profile-setting-row">
                                    <span className="setting-row-left">
                                        <Icon type="headset" size={19} />
                                        <span>Contact Support</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                                <button className="profile-setting-row">
                                    <span className="setting-row-left">
                                        <Icon type="shield" size={19} />
                                        <span>Terms & Privacy</span>
                                    </span>
                                    <Icon type="arrow" size={17} />
                                </button>

                            </div>

                        </section>

                    </div>

                </main>

            </div>

        </div>
    );
}

export default CustomerProfile;