import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useNavigate } from "react-router-dom";
const CustomerContext = createContext(null);
export function getApiErrorMessage(error, fallback = "Something went wrong") {
    if (!error) {
        return fallback;
    }

    if (typeof error.message === "string" && error.message.trim()) {
        return error.message;
    }

    if (typeof error.detail === "string" && error.detail.trim()) {
        return error.detail;
    }

    if (Array.isArray(error.detail)) {
        return error.detail
            .map((item) => item.msg || "Invalid value")
            .join(", ");
    }

    return fallback;
}
export function CustomerProvider({ children }) {
    const [cart, setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState(null);
const [menu, setMenu] = useState([]);
const [error, setError] = useState("");
const [cartConflict, setCartConflict] = useState(null);
const [addresses, setAddresses] = useState([]);
const [selectedAddressId, setSelectedAddressId] = useState(null);
const [showAddAddress, setShowAddAddress] = useState(false);
const [addressForm, setAddressForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
    latitude: null,
    longitude: null
});
const navigate = useNavigate();
const [addressSaving, setAddressSaving] = useState(false);
const [addressFormError, setAddressFormError] = useState("");
const [addressLoading, setAddressLoading] = useState(true);
const [addressError, setAddressError] = useState("");

const [deliveryCharge, setDeliveryCharge] = useState(null);
const [deliveryLoading, setDeliveryLoading] = useState(false);
const [deliveryError, setDeliveryError] = useState("");

const [showCheckout, setShowCheckout] = useState(false);

     async function loadCart() {
        try {
            setCartLoading(true);

            const data = await apiFetch(
                "/customer/cart"
            );

            setCart(data);
            console.log("CART DATA:", data);
console.log("CART ITEMS:", data.items);

        } catch (error) {

            if (error.status === 404) {
                setCart(null);
                return;
            }

            console.error(error);

            setError(
                error.message ||
                "Unable to load cart"
            );

        } finally {

            setCartLoading(false);

        }
    }


async function updateCartQuantity(
    cartItemId,
    quantity
) {
    if (quantity < 1) {
        return;
    }

    try {
        await apiFetch(
            `/customer/cart/items/${cartItemId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        await loadCart();

    } catch (error) {
        console.error(error);

        setError(
            error.message ||
            "Unable to update quantity"
        );
    }
}
    async function updateCartOptionQuantity(
    cartItemId,
    optionId,
    quantity
) {
    if (quantity < 0) {
        return;
    }

    try {
        await apiFetch(
            `/customer/cart/items/${cartItemId}/options/${optionId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    quantity: quantity
                })
            }
        );

        await loadCart();

    } catch (error) {
        console.error(
            "Error updating addon quantity:",
            error
        );

        setError(
            error.message ||
            "Unable to update add-on quantity"
        );
    }
}

    async function replaceCartAndAddItem() {
        if (!cartConflict) {
            return;
        }

        try {
            await apiFetch(
                "/customer/cart",
                {
                    method: "DELETE"
                }
            );

            await apiFetch(
                "/customer/cart/items",
                {
                    method: "POST",
                    body: JSON.stringify({
    menu_item_id: cartConflict.itemId,
    quantity: cartConflict.quantity,
    option_ids: cartConflict.optionIds,
    option_quantities: cartConflict.optionQuantities
})
                }
            );

            setCartConflict(null);

            await loadCart();

            setError("");

        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Unable to switch shops"
            );
        }
    }
    function getRowsForItem(itemId) {
    return (
        cart?.items?.filter(
            (row) => row.menu_item_id === itemId
        ) ?? []
    );
}


function findVariantRow(itemId, optionId) {
    return (
        getRowsForItem(itemId).find((row) => {

            const replaceOptions = (
                row.options ?? []
            )
                .filter(
                    (option) =>
                        option.price_mode === "REPLACE"
                )
                .map(
                    (option) => option.option_id
                );

            return (
                replaceOptions.length === 1 &&
                replaceOptions[0] === optionId
            );
        }) ?? null
    );
}


function findAddonParentRow(itemId, optionId) {
    const rows = getRowsForItem(itemId);

    return (
        rows.find((row) =>
            row.options?.some(
                (option) =>
                    option.option_id === optionId
            )
        ) ??
        rows[0] ??
        null
    );
}

    async function removeFromCart(cartItemId) {
        try {
            await apiFetch(
                `/customer/cart/items/${cartItemId}`,
                {
                    method: "DELETE"
                }
            );
            await loadCart();
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Unable to remove item"
            );
        }
    }

    async function addToCart(
    itemId,
    optionIds = [],
    quantity = 1,
    optionQuantities = {}
) {
    try {
        await apiFetch(
            "/customer/cart/items",
            {
                method: "POST",
                body: JSON.stringify({
                    menu_item_id: itemId,
                    quantity: quantity,
                    option_ids: optionIds,
                    option_quantities: optionQuantities,
                })
            }
        );

        await loadCart();

    } catch (error) {
    console.error(
        "Error adding item to cart:",
        error
    );

    if (error.status === 409) {
        setCartConflict({
            itemId: itemId,
            optionIds: optionIds,
            quantity: quantity,
            optionQuantities: optionQuantities,
            currentShopName: cart?.shop_name || "your current shop",
            requestedShopName: selectedShop?.shop_name || "the selected shop"
        });

        setError("");
        return;
    }

    setError(
        error.message ||
        "Unable to add item to cart"
    );
}
}


 async function loadAddresses() {
        setAddressLoading(true);
        setAddressError("");

        try {
            const data = await apiFetch(
    "/customer/addresses"
);


            setAddresses(data);

            // Automatically select the default address
            const defaultAddress = data.find(
                (address) => address.is_default
            );

            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.address_id);
            } else if (data.length > 0) {
                // Otherwise select the first address
                setSelectedAddressId(data[0].address_id);
            }

        } catch (error) {
            setAddressError(error.message);
        } finally {
            setAddressLoading(false);
        }
    }


    async function calculateDeliveryCharge(addressId) {
        if (!cart || !addressId) {
            return;
        }
        setDeliveryLoading(true);
        setDeliveryError("");
        try {
            const data = await apiFetch(
                    "/customer/delivery-charge",                {
                    method: "POST",
                    body: JSON.stringify({
                        shop_id: cart.shop_id,
                        address_id: addressId
                    })
                }
            );
            
            setDeliveryCharge(data);
        } catch (error) {
            console.error(
                "Delivery Charge Error :",
                error
            );
            setDeliveryCharge(null);

            setDeliveryError(
                error.message ||
                "Unable to calculate delivery charge"
            );
        } finally {

            setDeliveryLoading(false);
        }

    }

 async function saveAddress(formOverride = null) {
    setAddressSaving(true);
    setAddressFormError("");

    try {
        const formData = formOverride ?? addressForm;

        const data = await apiFetch(
            "/customer/addresses",
            {
                method: "POST",
                body: JSON.stringify(formData),
            }
        );

        // Add the new address to the existing list
        setAddresses((previousAddresses) => {
            if (data.is_default) {
                return [
                    ...previousAddresses.map((address) => ({
                        ...address,
                        is_default: false,
                    })),
                    data,
                ];
            }

            return [...previousAddresses, data];
        });

        // Select the newly created address
        setSelectedAddressId(data.address_id);

        // Close the existing checkout address form
        setShowAddAddress(false);

        // Clear the existing checkout form
        setAddressForm({
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            pincode: "",
            is_default: false,
            latitude: null,
            longitude: null
        });

        return data;

    } catch (error) {
        setAddressFormError(error.message);
        return null;

    } finally {
        setAddressSaving(false);
    }
}

async function updateAddress(addressId, formData) {
    setAddressError("");

    try {
        const data = await apiFetch(
            `/customer/addresses/${addressId}`,
            {
                method: "PUT",
                body: JSON.stringify(formData),
            }
        );

        setAddresses((previousAddresses) =>
            previousAddresses.map((address) => {
                if (address.address_id === addressId) {
                    return data;
                }

                if (data.is_default) {
                    return {
                        ...address,
                        is_default: false,
                    };
                }

                return address;
            })
        );

        // Address coordinates/delivery distance may have changed
        setDeliveryCharge(null);

        return data;

    } catch (error) {
        setAddressError(
            error.message || "Unable to update address"
        );

        return null;
    }
}

async function deleteAddress(addressId) {
    setAddressError("");

    try {
        await apiFetch(
            `/customer/addresses/${addressId}`,
            {
                method: "DELETE",
            }
        );

        setAddresses((previousAddresses) =>
            previousAddresses.filter(
                (address) => address.address_id !== addressId
            )
        );

        // If the deleted address was selected,
        // select another available address.
        if (selectedAddressId === addressId) {
            setAddresses((previousAddresses) => {
                const defaultAddress = previousAddresses.find(
                    (address) => address.is_default
                );

                const nextAddress =
                    defaultAddress ?? previousAddresses[0];

                setSelectedAddressId(
                    nextAddress?.address_id ?? null
                );

                return previousAddresses;
            });
        }

        // Delivery charge may depend on the selected address
        setDeliveryCharge(null);

        return true;

    } catch (error) {
        setAddressError(
            error.message || "Unable to delete address"
        );

        return false;
    }
}

        function placeOrder() {
        if (!selectedAddressId) {
            alert("Please select a delivery address.");
            return;
        }

        navigate("/customer/orders/review", {
            state: {
                cart: cart,
                address: addresses.find(
                    (address) =>
                        address.address_id === selectedAddressId
                )
            }
        });
    }

    useEffect(() => {
        loadCart();
    }, []);

    return (
        <CustomerContext.Provider
           value={{
    // Cart
    cart,
    cartLoading,
    addToCart,
    loadCart,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,

    // Shop / Menu
    selectedShop,
    menu,
    setSelectedShop,
    setMenu,

    // Addresses
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
    updateAddress,
    deleteAddress,

    // Delivery
    deliveryCharge,
    deliveryLoading,
    deliveryError,
    calculateDeliveryCharge,
    showCheckout,
    setShowCheckout,
    // Orders
    placeOrder,
}}
        >
            {children}
        </CustomerContext.Provider>
    );
}

export function useCustomerProfile() {
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState("");

    async function loadProfile() {
        setProfileLoading(true);
        setProfileError("");

        try {
            const data = await apiFetch("/customer/profile");
            setProfile(data);
            return data;
        } catch (error) {
            setProfileError(
                getApiErrorMessage(
                    error,
                    "Unable to load profile"
                )
            );
            return null;
        } finally {
            setProfileLoading(false);
        }
    }

    async function updateProfile(formData) {
        setProfileSaving(true);
        setProfileError("");

        try {
            const data = await apiFetch(
                "/customer/profile",
                {
                    method: "PUT",
                    body: JSON.stringify(formData),
                }
            );

            setProfile(data);

            return data;

        } catch (error) {
            setProfileError(
                getApiErrorMessage(
                    error,
                    "Unable to update profile"
                )
            );

            return null;

        } finally {
            setProfileSaving(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    return {
        profile,
        profileLoading,
        profileSaving,
        profileError,
        loadProfile,
        updateProfile,
    };
}

export function useCurrentLocationAddress() {
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");

    async function getCurrentLocation() {
        setLocationLoading(true);
        setLocationError("");

        if (!navigator.geolocation) {
            const message =
                "Geolocation is not supported by your browser.";

            setLocationError(message);
            setLocationLoading(false);

            return null;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                    }
                );
            });

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const response = await apiFetch(
                "/customer/addresses/reverse-geocode",
                {
                    method: "POST",
                    body: JSON.stringify({
                        latitude,
                        longitude,
                    }),
                }
            );

            return {
                ...response,
                latitude,
                longitude,
            };

        } catch (error) {
            console.error(
                "REVERSE GEOCODING ERROR:",
                error
            );

            let message =
                "Unable to get your current location. Please allow location access.";

            if (error?.code === 1) {
                message =
                    "Location permission was denied. Please allow location access.";
            } else if (error?.code === 2) {
                message =
                    "Unable to determine your current location.";
            } else if (error?.code === 3) {
                message =
                    "Location request timed out. Please try again.";
            } else if (error?.message) {
                message = getApiErrorMessage(error, message);
            }

            setLocationError(message);

            return null;

        } finally {
            setLocationLoading(false);
        }
    }

    return {
        locationLoading,
        locationError,
        getCurrentLocation,
    };
}


export function useCustomer() {
    return useContext(CustomerContext);
}