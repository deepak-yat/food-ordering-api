import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ShopProfile() {

    const navigate = useNavigate();

    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [shopImage, setShopImage] = useState(null);
    const [shopImagePreview, setShopImagePreview] = useState("");
    const [shopImageUploading, setShopImageUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        shop_name: "",
        description: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pincode: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/shop/my-profile",
                {
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load shop profile"
                );
            }

            setShop(data);

            setFormData({
                shop_name: data.shop_name || "",
                description: data.description || "",
                phone: data.phone || "",
                address_line1: data.address_line1 || "",
                address_line2: data.address_line2 || "",
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",
            });

        } catch (error) {
            console.error(
                "Failed to load shop profile:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }
    function validateShopImage(file) {
    if (!file) {
        return "Please select an image.";
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        return "Only JPG, PNG and WEBP images are allowed.";
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        return "Image must be smaller than 5 MB.";
    }

    return "";
}

function handleShopImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
        return;
    }

    const validationError = validateShopImage(file);

    if (validationError) {
        setError(validationError);
        return;
    }

    setError("");
    setShopImage(file);

    const previewUrl = URL.createObjectURL(file);
    setShopImagePreview(previewUrl);
}

async function uploadShopImage() {
    if (!shopImage) {
        return;
    }

    setShopImageUploading(true);
    setError("");
    setSuccess("");

    try {
        const formData = new FormData();
        formData.append("image", shopImage);

        const response = await fetch(
            "http://127.0.0.1:8000/shop/my-profile/image",
            {
                method: "POST",
                credentials: "include",
                body: formData,
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Failed to upload shop image"
            );
        }

        setShop(data);
        setShopImage(null);
        setShopImagePreview("");

        setSuccess("Shop image updated successfully.");
    } catch (error) {
        console.error("Failed to upload shop image:", error);
        setError(error.message);
    } finally {
        setShopImageUploading(false);
    }
}

    function startEditing() {
        setIsEditing(true);
        setError("");
        setSuccess("");
    }

    function cancelEditing() {
        if (!shop) {
            return;
        }

        setFormData({
            shop_name: shop.shop_name || "",
            description: shop.description || "",
            phone: shop.phone || "",
            address_line1: shop.address_line1 || "",
            address_line2: shop.address_line2 || "",
            city: shop.city || "",
            state: shop.state || "",
            pincode: shop.pincode || "",
        });

        setIsEditing(false);
        setError("");
        setSuccess("");
    }

    async function saveProfile() {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/shop/my-profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to update profile"
                );
            }

            setShop(data);

            setFormData({
                shop_name: data.shop_name || "",
                description: data.description || "",
                phone: data.phone || "",
                address_line1: data.address_line1 || "",
                address_line2: data.address_line2 || "",
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",
            });

            setIsEditing(false);
            setSuccess("Profile updated successfully.");

        } catch (error) {
            console.error(
                "Failed to update shop profile:",
                error
            );

            setError(error.message);

        } finally {
            setSaving(false);
        }
    }

    async function toggleShopStatus() {
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/shop/my-shop/status",
                {
                    method: "PUT",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to change shop status"
                );
            }

            setShop((previousShop) => ({
                ...previousShop,
                is_active: data.is_active,
            }));

            setSuccess(
                data.is_active
                    ? "Shop activated successfully."
                    : "Shop deactivated successfully."
            );

        } catch (error) {
            console.error(
                "Failed to change shop status:",
                error
            );

            setError(error.message);
        }
    }

    if (loading) {
        return (
            <div className="shop-profile-page">
                <p className="shop-profile-status">
                    Loading shop profile...
                </p>
            </div>
        );
    }

    if (!shop && error) {
        return (
            <div className="shop-profile-page">

                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <p className="shop-profile-error">
                    {error}
                </p>

            </div>
        );
    }

    return (
        <div className="shop-profile-page">

            {/* Header */}

            <div className="shop-profile-header">

                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Go Back
                </button>

                <div>
                    <span className="eyebrow">
                        SHOP PROFILE
                    </span>

                    <h1>
                        {isEditing
                            ? "Edit Shop Profile"
                            : shop.shop_name}
                    </h1>
                </div>

                <span
                    className={`shop-profile-status-badge ${
                        shop.is_active
                            ? "active"
                            : "inactive"
                    }`}
                >
                    {shop.is_active
                        ? "Active"
                        : "Inactive"}
                </span>

            </div>

            {error && (
                <p className="shop-profile-error">
                    {error}
                </p>
            )}

            {success && (
                <p className="shop-profile-success">
                    {success}
                </p>
            )}

            <div className="shop-profile-card">

                {!isEditing ? (
                    

                    <>
 <section className="shop-profile-section">
    <div className="shop-profile-image-row">
        <span className="eyebrow">
            SHOP IMAGE
        </span>

        <div className="shop-profile-image-display">
            {shop.image_url ? (
                <img
                    src={`http://127.0.0.1:8000${shop.image_url}`}
                    alt={shop.shop_name}
                />
            ) : (
                <div className="shop-profile-image-placeholder">
                    {shop.shop_name.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    </div>
</section>
                        {/* Shop Information */}

                        <section className="shop-profile-section">

                            <span className="eyebrow">
                                SHOP INFORMATION
                            </span>

                            <div className="shop-profile-field">

                                <span>
                                    Shop Name
                                </span>

                                <strong>
                                    {shop.shop_name}
                                </strong>

                            </div>

                            <div className="shop-profile-field">

                                <span>
                                    Description
                                </span>

                                <strong>
                                    {shop.description ||
                                        "No description added"}
                                </strong>

                            </div>

                            <div className="shop-profile-field">

                                <span>
                                    Phone Number
                                </span>

                                <strong>
                                    {shop.phone ||
                                        "No phone number added"}
                                </strong>

                            </div>

                        </section>


                        {/* Address */}

                        <section className="shop-profile-section">

                            <span className="eyebrow">
                                SHOP ADDRESS
                            </span>

                            <div className="shop-profile-address">

                                {shop.address_line1 ? (
                                    <p>
                                        {shop.address_line1}
                                    </p>
                                ) : (
                                    <p>
                                        No address added
                                    </p>
                                )}

                                {shop.address_line2 && (
                                    <p>
                                        {shop.address_line2}
                                    </p>
                                )}

                                {(shop.city ||
                                    shop.state ||
                                    shop.pincode) && (

                                    <p>

                                        {shop.city}

                                        {shop.city &&
                                            shop.state
                                            ? ", "
                                            : ""}

                                        {shop.state}

                                        {shop.pincode
                                            ? ` - ${shop.pincode}`
                                            : ""}

                                    </p>
                                )}

                            </div>

                        </section>


                        {/* Actions */}

                        <div className="shop-profile-actions">

                            <button
                                className="primary-button"
                                onClick={startEditing}
                            >
                                Edit Profile
                            </button>

                            <button
                                className={
                                    shop.is_active
                                        ? "danger-button"
                                        : "secondary-button"
                                }
                                onClick={toggleShopStatus}
                            >
                                {shop.is_active
                                    ? "Deactivate Shop"
                                    : "Activate Shop"}
                            </button>

                        </div>

                    </>

                ) : (

                    <>
                        {/* Edit Shop Information */}

                        <section className="shop-profile-section">

                            <span className="eyebrow">
                                SHOP INFORMATION
                            </span>

                            <div className="shop-profile-form-group">

                                <label>
                                    Shop Name
                                </label>

                                <input
                                    type="text"
                                    name="shop_name"
                                    value={formData.shop_name}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="shop-profile-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="5"
                                />

                            </div>

                            <div className="shop-profile-form-group">

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />

                            </div>

                        </section>



                    <section className="shop-profile-section">
    <span className="eyebrow">
        SHOP IMAGE
    </span>

    <div className="shop-profile-form-group">
        <label htmlFor="shop_image">
            Shop Image
        </label>

        <input
            id="shop_image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleShopImageChange}
            disabled={shopImageUploading}
        />

        {(shopImagePreview || shop?.image_url) && (
            <div className="shop-image-preview">
                <img
                    src={
                        shopImagePreview ||
                        `http://127.0.0.1:8000${shop.image_url}`
                    }
                    alt="Shop preview"
                />
            </div>
        )}

        <button
            type="button"
            className="secondary-button"
            onClick={uploadShopImage}
            disabled={!shopImage || shopImageUploading}
        >
            {shopImageUploading
                ? "Uploading..."
                : "Upload Shop Image"}
        </button>
    </div>
</section>

                        {/* Edit Address */}

                        <section className="shop-profile-section">

                            <span className="eyebrow">
                                SHOP ADDRESS
                            </span>

                            <div className="shop-profile-form-group">

                                <label>
                                    Address Line 1
                                </label>

                                <input
                                    type="text"
                                    name="address_line1"
                                    value={formData.address_line1}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="shop-profile-form-group">

                                <label>
                                    Address Line 2
                                </label>

                                <input
                                    type="text"
                                    name="address_line2"
                                    value={formData.address_line2}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="shop-profile-location-grid">

                                <div className="shop-profile-form-group">

                                    <label>
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />

                                </div>

                                <div className="shop-profile-form-group">

                                    <label>
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            <div className="shop-profile-form-group">

                                <label>
                                    Pincode
                                </label>

                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                />

                            </div>

                        </section>


                        {/* Edit Actions */}

                        <div className="shop-profile-actions">

                            <button
                                className="primary-button"
                                onClick={saveProfile}
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>

                            <button
                                className="secondary-button"
                                onClick={cancelEditing}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                        </div>

                    </>

                )}

            </div>

        </div>
    );
}

export default ShopProfile;