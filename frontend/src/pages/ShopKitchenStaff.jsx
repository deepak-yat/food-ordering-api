import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/ShopKitchenStaff.css";
import { useNavigate } from "react-router-dom";
const EMPTY_FORM = {
    user_name: "",
    password: "",
    full_name: "",
    phone_number: "",
    address: "",
    age: "",
    gender: "male",
    food_preference: "non_veg",
    specialties: "",
};

function ShopKitchenStaff() {
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const [passwordStaff, setPasswordStaff] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // =========================
    // Load Staff
    // =========================

    const loadStaff = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/shop/kitchen-staff");

            setStaff(data);
        } catch (err) {
            console.error("Failed to load kitchen staff:", err);

            setError(
                err.message || "Failed to load kitchen staff."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    // =========================
    // Helpers
    // =========================

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingStaff(null);
        setShowForm(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =========================
    // Add Staff
    // =========================

    const openAddForm = () => {
        clearMessages();

        setEditingStaff(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    // =========================
    // Edit Staff
    // =========================

    const openEditForm = (member) => {
        clearMessages();

        setEditingStaff(member);

        setForm({
            user_name: member.user_name,
            password: "",
            full_name: member.full_name,
            phone_number: member.phone_number,
            address: member.address,
            age: member.age,
            gender: member.gender,
            food_preference: member.food_preference,
            specialties: member.specialties || "",
        });

        setShowForm(true);
    };

    // =========================
    // Save Staff
    // =========================

    const handleSaveStaff = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            clearMessages();

            if (editingStaff) {
                await apiFetch(
                    `/shop/kitchen-staff/${editingStaff.staff_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            full_name: form.full_name.trim(),
                            phone_number: form.phone_number.trim(),
                            address: form.address.trim(),
                            age: Number(form.age),
                            gender: form.gender,
                            food_preference: form.food_preference,
                            specialties:
                            form.specialties.trim() || null,
                        }),
                    }
                );

                setSuccess(
                    `${form.full_name} updated successfully.`
                );
            } else {
                await apiFetch("/shop/kitchen-staff", {
                    method: "POST",
                    body: JSON.stringify({
                        user_name: form.user_name.trim(),
                        password: form.password,
                        full_name: form.full_name.trim(),
                        phone_number: form.phone_number.trim(),
                        address: form.address.trim(),
                        age: Number(form.age),
                        gender: form.gender,
                        food_preference: form.food_preference,
                        specialties:
                            form.specialties.trim() || null,
                    }),
                });

                setSuccess(
                    `${form.full_name} added successfully.`
                );
            }

            resetForm();
            await loadStaff();
        } catch (err) {
            console.error("Failed to save kitchen staff:", err);

            setError(
                err.message || "Failed to save kitchen staff."
            );
        } finally {
            setSaving(false);
        }
    };

    // =========================
    // Activate / Deactivate
    // =========================

    const handleStatusToggle = async (member) => {
        const action = member.is_active
            ? "deactivate"
            : "activate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${member.full_name}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            clearMessages();

            const response = await apiFetch(
                `/shop/kitchen-staff/${member.staff_id}/status`,
                {
                    method: "PUT",
                }
            );

            setSuccess(
                response.is_active
                    ? `${member.full_name} is now active.`
                    : `${member.full_name} has been deactivated.`
            );

            await loadStaff();
        } catch (err) {
            console.error(
                "Failed to update staff status:",
                err
            );

            setError(
                err.message ||
                "Failed to update staff status."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // Password
    // =========================

    const openPasswordForm = (member) => {
        clearMessages();

        setPasswordStaff(member);
        setNewPassword("");
    };

    const closePasswordForm = () => {
        setPasswordStaff(null);
        setNewPassword("");
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();

        if (newPassword.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        try {
            setPasswordLoading(true);
            clearMessages();

            await apiFetch(
                `/shop/kitchen-staff/${passwordStaff.staff_id}/password`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        new_password: newPassword,
                    }),
                }
            );

            setSuccess(
                `Password updated for ${passwordStaff.full_name}.`
            );

            closePasswordForm();
        } catch (err) {
            console.error(
                "Failed to update password:",
                err
            );

            setError(
                err.message ||
                "Failed to update password."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="shop-kitchen-staff-page">

            {/* =========================
                Header
            ========================= */}

            <div className="shop-kitchen-staff-header">
                 <button
            type="button"
            className="kitchen-staff-back-btn"
            onClick={() => navigate("/shop/dashboard")}
        >
            ← Dashboard
        </button>
                <div>
                    <h1>Kitchen Staff</h1>

                    <p>
                        Manage your kitchen staff and
                        accounts.
                    </p>
                </div>

                <button
                    type="button"
                    className="kitchen-staff-primary-btn"
                    onClick={openAddForm}
                >
                    + Add Kitchen Staff
                </button>
            </div>

            {/* =========================
                Messages
            ========================= */}

            {error && (
                <div className="kitchen-staff-message error">
                    {error}
                </div>
            )}

            {success && (
                <div className="kitchen-staff-message success">
                    {success}
                </div>
            )}

            {/* =========================
                Add / Edit Form
            ========================= */}

            {showForm && (
                <form
                    className="kitchen-staff-form"
                    onSubmit={handleSaveStaff}
                >
                    <div className="kitchen-staff-form-header">
                        <div>
                            <h2>
                                {editingStaff
                                    ? "Edit Kitchen Staff"
                                    : "Add Kitchen Staff"}
                            </h2>

                            <p>
                                {editingStaff
                                    ? "Update the staff member's details."
                                    : "Create a login account for a kitchen staff member."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="kitchen-staff-close-btn"
                            onClick={resetForm}
                        >
                            ×
                        </button>
                    </div>

                    <div className="kitchen-staff-form-grid">

                        {!editingStaff && (
                            <>
                                <div className="kitchen-staff-field">
                                    <label>
                                        Username
                                    </label>

                                    <input
                                        type="text"
                                        name="user_name"
                                        value={
                                            form.user_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter username"
                                        minLength={3}
                                        maxLength={50}
                                        required
                                    />
                                </div>

                                <div className="kitchen-staff-field">
                                    <label>
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={
                                            form.password
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter password"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="kitchen-staff-field">
                            <label>Full Name</label>

                            <input
                                type="text"
                                name="full_name"
                                value={form.full_name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="kitchen-staff-field">
                            <label>Phone Number</label>

                            <input
                                type="text"
                                name="phone_number"
                                value={
                                    form.phone_number
                                }
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                required
                            />
                        </div>

                        <div className="kitchen-staff-field">
                            <label>Age</label>

                            <input
                                type="number"
                                name="age"
                                value={form.age}
                                onChange={handleChange}
                                min="18"
                                max="100"
                                placeholder="Age"
                                required
                            />
                        </div>

                        <div className="kitchen-staff-field">
                            <label>Gender</label>

                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                            >
                                <option value="male">
                                    Male
                                </option>

                                <option value="female">
                                    Female
                                </option>

                                <option value="other">
                                    Other
                                </option>
                            </select>
                        </div>

                        <div className="kitchen-staff-field">
                            <label>
                                Food Preference
                            </label>

                            <select
                                name="food_preference"
                                value={
                                    form.food_preference
                                }
                                onChange={handleChange}
                            >
                                <option value="veg">
                                    Veg
                                </option>

                                <option value="non_veg">
                                    Non-Veg
                                </option>
                            </select>
                        </div>

                        <div className="kitchen-staff-field">
                            <label>Specialties</label>

                            <input
                                type="text"
                                name="specialties"
                                value={
                                    form.specialties
                                }
                                onChange={handleChange}
                                placeholder="e.g. Grills, Biryani"
                            />
                        </div>

                        <div className="kitchen-staff-field full">
                            <label>Address</label>

                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Enter address"
                                rows="3"
                                required
                            />
                        </div>
                    </div>

                    <div className="kitchen-staff-form-actions">
                        <button
                            type="button"
                            className="kitchen-staff-secondary-btn"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="kitchen-staff-primary-btn"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingStaff
                                    ? "Save Changes"
                                    : "Create Staff"}
                        </button>
                    </div>
                </form>
            )}

            {/* =========================
                Staff List
            ========================= */}

            {loading ? (
                <div className="kitchen-staff-state">
                    Loading kitchen staff...
                </div>
            ) : staff.length === 0 ? (
                <div className="kitchen-staff-state">
                    <h3>No Kitchen Staff</h3>

                    <p>
                        Add your first kitchen staff
                        member to get started.
                    </p>
                </div>
            ) : (
                <div className="kitchen-staff-list">

                    {staff.map((member) => (
                        <div
                            key={member.staff_id}
                            className={`kitchen-staff-card ${!member.is_active
                                    ? "inactive"
                                    : ""
                                }`}
                        >
                            {/* Identity */}
                            <div className="kitchen-staff-identity">
                                <div className="kitchen-staff-avatar">
                                    {member.full_name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="kitchen-staff-name">
                                    <h3>
                                        {
                                            member.full_name
                                        }
                                    </h3>

                                    <p>
                                        @{member.user_name}
                                    </p>

                                    <span
                                        className={`kitchen-staff-status ${member.is_active
                                                ? "active"
                                                : "inactive"
                                            }`}
                                    >
                                        {member.is_active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="kitchen-staff-info">

                                <div>
                                    <span>Phone</span>
                                    <strong>
                                        {
                                            member.phone_number
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>Age</span>
                                    <strong>
                                        {member.age}
                                    </strong>
                                </div>

                                <div>
                                    <span>Gender</span>
                                    <strong>
                                        {member.gender}
                                    </strong>
                                </div>

                                <div>
                                    <span>Preference</span>
                                    <strong>
                                        {member.food_preference ===
                                            "non_veg"
                                            ? "Non-Veg"
                                            : "Veg"}
                                    </strong>
                                </div>

                                <div className="specialties">
                                    <span>
                                        Specialties
                                    </span>

                                    <strong>
                                        {member.specialties ||
                                            "Not specified"}
                                    </strong>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="kitchen-staff-actions">

                                <button
                                    type="button"
                                    className="kitchen-staff-secondary-btn"
                                    onClick={() =>
                                        openEditForm(
                                            member
                                        )
                                    }
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    className="kitchen-staff-secondary-btn"
                                    onClick={() =>
                                        openPasswordForm(
                                            member
                                        )
                                    }
                                >
                                    Password
                                </button>

                                <button
                                    type="button"
                                    className={
                                        member.is_active
                                            ? "kitchen-staff-danger-btn"
                                            : "kitchen-staff-activate-btn"
                                    }
                                    onClick={() =>
                                        handleStatusToggle(
                                            member
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    {member.is_active
                                        ? "Deactivate"
                                        : "Activate"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* =========================
                Password Dialog
            ========================= */}

            {passwordStaff && (
                <div className="kitchen-staff-overlay">
                    <div className="kitchen-staff-password-dialog">

                        <div className="password-dialog-header">
                            <div>
                                <h2>
                                    Change Password
                                </h2>

                                <p>
                                    {
                                        passwordStaff.full_name
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                className="kitchen-staff-close-btn"
                                onClick={
                                    closePasswordForm
                                }
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handlePasswordChange
                            }
                        >
                            <div className="kitchen-staff-field">
                                <label>
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    minLength={6}
                                    required
                                />
                            </div>

                            <div className="password-dialog-actions">
                                <button
                                    type="button"
                                    className="kitchen-staff-secondary-btn"
                                    onClick={
                                        closePasswordForm
                                    }
                                    disabled={
                                        passwordLoading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="kitchen-staff-primary-btn"
                                    disabled={
                                        passwordLoading
                                    }
                                >
                                    {passwordLoading
                                        ? "Updating..."
                                        : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShopKitchenStaff;