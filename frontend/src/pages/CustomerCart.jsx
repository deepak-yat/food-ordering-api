import { useCustomer } from "../context/CustomerContext";
import { useEffect } from "react";
import CartRestaurantHeader from "../components/cart/CartRestaurantHeader";
import CartItemCard from "../components/cart/CartItemCard";
import CartOrderSummary from "../components/cart/CartOrderSummary";
import CartEmptyState from "../components/cart/CartEmptyState";
import CartRecommended from "../components/cart/CartRecommended";
import { apiFetch } from "../api/client";
import "../styles/cart/cart-page.css";
import { useNavigate } from "react-router-dom";

function CustomerCart() {
    const navigate = useNavigate();
 const {
    cart,
    cartLoading,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
    addToCart,
    selectedShop,
    menu,
    setSelectedShop,
    setMenu,

    // Checkout
    showCheckout,
    setShowCheckout,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    showAddAddress,
    setShowAddAddress,
    addressForm,
    setAddressForm,
    addressSaving,
    addressFormError,
    addressLoading,
    addressError,
    loadAddresses,
    saveAddress,
    deliveryCharge,
    deliveryLoading,
    deliveryError,
    calculateDeliveryCharge,
    placeOrder,

} = useCustomer();
    useEffect(() => {
    loadAddresses();
}, []);
useEffect(() => {
    if (!cart?.shop_id) {
        return;
    }
    
    async function loadCartShopMenu() {
        try {
            const data = await apiFetch(
                `/customer/view-shop/${cart.shop_id}/menu`
            );
            setSelectedShop({
    shop_id: cart.shop_id,
    shop_name: cart.shop_name
});

            setMenu(data);

        } catch (error) {
            console.error(
                "Unable to load cart shop menu:",
                error
            );
        }
    }

    loadCartShopMenu();
}, [cart?.shop_id, setMenu]);

useEffect(() => {
    if (!showCheckout || !selectedAddressId || !cart?.shop_id) {
        return;
    }

    calculateDeliveryCharge(selectedAddressId);
}, [
    showCheckout,
    selectedAddressId,
    cart?.shop_id
]);
    if (cartLoading) {
        return (
            <div className="cartpage">
                <div className="cartpage-container">
                    <p>Loading cart...</p>
                </div>
            </div>
        );
    }

    if (!cart || !cart.items?.length) {
        return (
            <div className="cartpage">
                <div className="cartpage-container">
                    <CartEmptyState
                        onContinueShopping={() =>
                            window.history.back()
                        }
                    />
                </div>
            </div>
        );
    }


const menuItemLookup = new Map(
    menu
        .flatMap((category) => category.items || [])
        .map((item) => [item.item_id, item])
);


    return (
        <div className="cartpage">
            <div className="cartpage-container">

                {/* Continue Shopping */}
                <button
                    type="button"
                    className="cartpage-continue-button"
                    onClick={() => window.history.back()}
                >
                    ← Continue Shopping
                </button>

                {/* Page Heading */}
                <div className="cartpage-heading">
                    <h1>Your Cart</h1>

                    <p>
                        {cart.items.reduce(
                            (total, item) =>
                                total + item.quantity,
                            0
                        )}{" "}
                        items from {cart.shop_name}
                    </p>
                </div>

                {/* Main Content */}
                <div className="cartpage-main">

                    {/* LEFT */}
                    <div className="cartpage-left">

                        <div className="cartpage-cart-card">

                           <CartRestaurantHeader
    cart={cart}
    onViewRestaurant={() => {
        navigate("/customer/dashboard");
    }}
/>

                            <div className="cartpage-items">
                                {cart.items.map((item) => (
                                    <CartItemCard
                                        key={item.cart_item_id}
                                        item={item}
                                        menuItemLookup={menuItemLookup}
                                        updateCartQuantity={
                                            updateCartQuantity
                                        }
                                        updateCartOptionQuantity={
                                            updateCartOptionQuantity
                                        }
                                        removeFromCart={
                                            removeFromCart
                                        }
                                    />
                                ))}
                            </div>

                        </div>

                    </div>

                    {/* RIGHT */}
                    <div className="cartpage-right">

                       <CartOrderSummary
    cart={cart}
    onCheckout={() => {
        setShowCheckout(true);
    }}
/>

                    </div>

                </div>

                <CartRecommended
    menu={menu}
    selectedShop={selectedShop}
    cart={cart}
    onAdd={(itemId) => {
    addToCart(itemId);
}}
/>

            </div>
        {showCheckout && cart && (
            <div className="checkout-overlay">

                <div
                    className="checkout-modal"
                    onClick={(event) =>
                        event.stopPropagation()
                    }
                >

                    <div className="checkout-header">

                        <div>
                            <span className="eyebrow">
                                CHECKOUT
                            </span>

                            <h2>
                                Review your order
                            </h2>
                        </div>

                        <button
                            className="modal-close"
                            onClick={() =>
                                setShowCheckout(false)
                            }
                        >
                            ×
                        </button>

                    </div>


                    <div className="checkout-shop">
                        <span>
                            Shop
                        </span>

                        <strong>
                            {cart.shop_name}
                        </strong>
                    </div>


                    <div className="checkout-items">

                        {cart.items.map(item => (
                            <div
                                key={item.cart_item_id}
                                className="checkout-item"
                            >

                                <span>
                                    {item.name}
                                    × {item.quantity}
                                </span>

                                <strong>
                                    ₹{Number(
                                        item.subtotal
                                    ).toFixed(2)}
                                </strong>

                            </div>
                        ))}

                    </div>


                    <div className="checkout-summary">

                        <div className="checkout-summary-row">
                            <span>Items Total</span>

                            <strong>
                                ₹{Number(cart.total).toFixed(2)}
                            </strong>
                        </div>


                        <div className="checkout-summary-row">
                            <span>Delivery</span>

                            {deliveryLoading ? (
                                <span>Calculating...</span>
                            ) : deliveryCharge ? (
                                <strong>
                                    ₹{Number(
                                        deliveryCharge.delivery_fee
                                    ).toFixed(2)}
                                </strong>
                            ) : (
                                <span>—</span>
                            )}
                        </div>


                        {deliveryCharge && (
                            <div className="checkout-distance">
                                Delivery distance:{" "}
                                {Number(
                                    deliveryCharge.distance_km
                                ).toFixed(2)} km
                            </div>
                        )}


                        {deliveryError && (
                            <p className="address-form-error">
                                {deliveryError}
                            </p>
                        )}


                        <div className="checkout-total">

                            <span>Grand Total</span>

                            <strong>
                                ₹{(
                                    Number(cart.total) +
                                    Number(
                                        deliveryCharge?.delivery_fee || 0
                                    )
                                ).toFixed(2)}
                            </strong>

                        </div>

                    </div>


                    <div className="checkout-address-section">

                        <span className="eyebrow">
                            DELIVERY ADDRESS
                        </span>

                        {addressLoading ? (
                            <p className="status-text">
                                Loading saved addresses...
                            </p>
                        ) : addressError ? (
                            <p className="status-text">
                                {addressError}
                            </p>
                        ) : addresses.length === 0 ? (
                            <p className="status-text">
                                No saved addresses yet.
                            </p>
                        ) : (
                            <div className="address-list">

                                {addresses.map((address) => (
                                    <div
                                        key={address.address_id}
                                        className={`address-card ${selectedAddressId === address.address_id
                                            ? "selected"
                                            : ""
                                            }`}
                                        onClick={() => {
                                            setSelectedAddressId(address.address_id);
                                            calculateDeliveryCharge(address.address_id);
                                        }}
                                    >
                                        <div className="address-card-header">

                                            <span>
                                                {address.address_line1}
                                            </span>

                                            {address.is_default && (
                                                <span className="default-badge">
                                                    Default
                                                </span>
                                            )}

                                        </div>

                                        {address.address_line2 && (
                                            <p>{address.address_line2}</p>
                                        )}

                                        <p>
                                            {address.city}, {address.state} - {address.pincode}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            className="add-address-btn"
                            onClick={() => {
                                setShowAddAddress(true);
                                setAddressFormError("");
                            }}
                        >
                            + Add Address
                        </button>

                        {showAddAddress && (
                            <div className="add-address-form">

                                <div className="address-form-header">
                                    <h3>Add New Address</h3>

                                    <button
                                        type="button"
                                        className="close-address-form"
                                        onClick={() => setShowAddAddress(false)}
                                    >
                                        ×
                                    </button>
                                </div>

                                {addressFormError && (
                                    <p className="address-form-error">
                                        {addressFormError}
                                    </p>
                                )}

                                <input
                                    type="text"
                                    placeholder="Address Line 1"
                                    value={addressForm.address_line1}
                                    onChange={(event) =>
                                        setAddressForm({
                                            ...addressForm,
                                            address_line1: event.target.value,
                                        })
                                    }
                                />

                                <input
                                    type="text"
                                    placeholder="Address Line 2 (Optional)"
                                    value={addressForm.address_line2}
                                    onChange={(event) =>
                                        setAddressForm({
                                            ...addressForm,
                                            address_line2: event.target.value,
                                        })
                                    }
                                />

                                <div className="address-form-row">

                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={addressForm.city}
                                        onChange={(event) =>
                                            setAddressForm({
                                                ...addressForm,
                                                city: event.target.value,
                                            })
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={addressForm.state}
                                        onChange={(event) =>
                                            setAddressForm({
                                                ...addressForm,
                                                state: event.target.value,
                                            })
                                        }
                                    />

                                </div>

                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    value={addressForm.pincode}
                                    onChange={(event) =>
                                        setAddressForm({
                                            ...addressForm,
                                            pincode: event.target.value,
                                        })
                                    }
                                />

                                <label className="default-address-checkbox">

                                    <input
                                        type="checkbox"
                                        checked={addressForm.is_default}
                                        onChange={(event) =>
                                            setAddressForm({
                                                ...addressForm,
                                                is_default: event.target.checked,
                                            })
                                        }
                                    />

                                    Set as default address

                                </label>

                                <button
                                    type="button"
                                    className="save-address-btn"
                                    onClick={saveAddress}
                                    disabled={addressSaving}
                                >
                                    {addressSaving ? "Saving..." : "Save Address"}
                                </button>

                            </div>
                        )}

                    </div>


                    <button
                        className="primary-button checkout-place-button"
                        disabled={!selectedAddressId}
                        onClick={placeOrder}
                    >
                        Place Order
                    </button>

                </div>

            </div>
        )}

        </div>
    );
}

export default CustomerCart;