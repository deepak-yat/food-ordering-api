import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useNavigate } from "react-router-dom";
const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
    const [cart, setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [selectedShop, setSelectedShop] = useState(null);
const [menu, setMenu] = useState([]);
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

       async function saveAddress() {
        setAddressSaving(true);
        setAddressFormError("");

        try {
            const data = await apiFetch(
                "/customer/addresses",
                {
                    method: "POST",
                    body: JSON.stringify(addressForm),
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

            // Close the form
            setShowAddAddress(false);

            // Clear the form
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

        } catch (error) {
            setAddressFormError(error.message);
        } finally {
            setAddressSaving(false);
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
    cart,
    cartLoading,
    addToCart,
    loadCart,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
    selectedShop,
    menu,
    setSelectedShop,
    loadAddresses,
    calculateDeliveryCharge,
    saveAddress,
    setMenu,
    placeOrder
    
}}
        >
            {children}
        </CustomerContext.Provider>
    );
}

export function useCustomer() {
    return useContext(CustomerContext);
}