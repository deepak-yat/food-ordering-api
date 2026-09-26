import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import Cart from "../components/Cart";
import SpecialOffers from "../components/SpecialOffers";
import { getBrowserCoordinates } from "../utils/geolocation";
import FeaturedItemsCarousel from "../components/FeaturedItemCarousel";
import ReviewModal from "../components/ReviewModal";
import {
    useNavigate
} from "react-router-dom";
function CustomerDashboard() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({
        shops: [],
        items: [],
    });
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchedItemId, setSearchedItemId] = useState(null);
    const [activeOfferId, setActiveOfferId] = useState(null);
    const [selectedShop, setSelectedShop] = useState(null);
    const [menu, setMenu] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [expandedItems, setExpandedItems] = useState({});
    const [cartLoading, setCartLoading] = useState(true);
    const [cartConflict, setCartConflict] = useState(null);
    const [selectedConfigItem, setSelectedConfigItem] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [configQuantity, setConfigQuantity] = useState(1);
    const [configError, setConfigError] = useState("");
    const [showCheckout, setShowCheckout] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
        const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [reviewItem, setReviewItem] = useState(null);
    const [profileForm, setProfileForm] = useState({
        customer_name: "",
        phone: ""
    });
    const [currentShopPage, setCurrentShopPage] = useState(1);

    const shopsPerPage = 4;

    const totalShopPages = Math.ceil(
        shops.length / shopsPerPage
    );

    const startShopIndex =
        (currentShopPage - 1) * shopsPerPage;

    const visibleShops = shops.slice(
        startShopIndex,
        startShopIndex + shopsPerPage
    );

    useEffect(() => {
        setCurrentShopPage(1);
    }, [shops]);
    useEffect(() => {
        const timeout = setTimeout(() => {
            searchFoodly(searchQuery);
        }, 250);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    useEffect(() => {
    if (!activeOfferId || !selectedShop || !menu.length) {
        return;
    }

    const targetItem = menu
        .flatMap((category) => category.items || [])
        .find((item) => item.offer?.offer_id === activeOfferId);

    if (targetItem && targetItem.item_id !== searchedItemId) {
        setSearchedItemId(targetItem.item_id);
    }
}, [menu, activeOfferId, selectedShop, searchedItemId]);

    useEffect(() => {
        if (!searchedItemId || !selectedShop) {
            return;
        }

        const element = document.getElementById(
            `searched-food-${searchedItemId}`
        );

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [menu, searchedItemId, selectedShop]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [pendingOrderCount, setPendingOrderCount] = useState(0);
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

    const [addressSaving, setAddressSaving] = useState(false);
    const [addressFormError, setAddressFormError] = useState("");
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressError, setAddressError] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);

    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [currentLocation, setCurrentLocation] = useState({
        latitude: null,
        longitude: null
    });

    const [deliveryCharge, setDeliveryCharge] = useState(null);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryError, setDeliveryError] = useState("");
    useEffect(() => {
    let cancelled = false;
    console.log("LOCATION EFFECT RUNNING");
    async function resolveLocation() {
        let coords = await getBrowserCoordinates();
            console.log("BROWSER COORDS:", coords);
        if (!coords) {
            const fallback =
                addresses.find((address) => address.is_default) ||
                addresses[0];
                console.log("FALLBACK ADDRESS:", fallback);
            if (
                fallback?.latitude != null &&
                fallback?.longitude != null
            ) {
                coords = {
                    latitude: fallback.latitude,
                    longitude: fallback.longitude
                };
            }
        }
        console.log("FINAL COORDS:", coords);
        if (!cancelled && coords) {
            setCurrentLocation(coords);
            loadShops(coords.latitude, coords.longitude);
        }
    }

    loadShops();
    loadCart();
    loadAddresses();

    resolveLocation();

    return () => {
        cancelled = true;
    };
}, []);

    useEffect(() => {
        if (showCheckout && selectedAddressId) {
            calculateDeliveryCharge(selectedAddressId);
        }
    }, [showCheckout]);

   async function loadShops(latitude = null, longitude = null) {
    console.log("LOAD SHOPS COORDS:", latitude, longitude);
    try {

        let endpoint = "/customer/view-shop";

        if (latitude !== null && longitude !== null) {

            endpoint += `?lat=${latitude}&lng=${longitude}`;

        }
        console.log("SHOP ENDPOINT:", endpoint);
        const data = await apiFetch(endpoint);
        console.log("SHOP DATA:", data);
        setShops(data);

    } catch (error) {

        console.error(error);

        setError(

            error.message ||

            "Unable to load shops"

        );

    } finally {

        setLoading(false);

    }

}

    async function viewShopMenu(shopId) {

        try {
            setMenuLoading(true);
            setError("");
            const shop = shops.find(
                shop => shop.shop_id === shopId
            );

            setSelectedShop(shop);
            const data = await apiFetch(
                `/customer/view-shop/${shopId}/menu`
            );
            setMenu(data);
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Unable to load menu"
            );
        } finally {
            setMenuLoading(false)
        }

    }

    function backToShops() {
    setSelectedShop(null);
    setMenu([]);
    setActiveOfferId(null);
    setError("");
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

    function openItemConfiguration(item){
        setSelectedConfigItem(item);
        setSelectedOptions({});
        setConfigQuantity(1);
        setConfigError("");
    }

    function toggleItemOptions(itemId) {
    setExpandedItems((previous) => ({
        ...previous,
        [itemId]: !previous[itemId]
    }));
    }

    function closeItemConfiguration(){
        setSelectedConfigItem(null);
        setSelectedOptions({});
        setConfigQuantity(1);
        setConfigError("");
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



    function handleOptionSelection(group, optionId) {
    setSelectedOptions((previous) => {

        const currentSelection =
            previous[group.group_id] || [];

        if (group.selection_type === "SINGLE") {

            return {
                ...previous,
                [group.group_id]: [optionId]
            };
        }

        const alreadySelected =
            currentSelection.includes(optionId);

        if (alreadySelected) {

            return {
                ...previous,
                [group.group_id]:
                    currentSelection.filter(
                        (id) => id !== optionId
                    )
            };
        }

        return {
            ...previous,
            [group.group_id]: [
                ...currentSelection,
                optionId
            ]
        };
    });
}

async function addConfiguredItem(item) {
    const optionIds = Object.values(selectedOptions).flat();

    if (optionIds.length === 0) {
        setConfigError("Please select an option.");
        return;
    }

    await addToCart(
        item.item_id,
        optionIds,
        configQuantity
    );

    setConfigError("");
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

    function getMenuItemQuantity(itemId) {
        if (!cart || !cart.items) {
            return 0;
        }

        const cartItem = cart.items.find(
            (cartItem) =>
                cartItem.menu_item_id === itemId
        );

        return cartItem ? cartItem.quantity : 0;
    }


    function getConfiguredItemQuantity(itemId, optionIds) {
    if (!cart || !cart.items) {
        return 0;
    }

    const sortedOptionIds = [...optionIds].sort();

    const cartItem = cart.items.find((cartItem) => {
        if (cartItem.menu_item_id !== itemId) {
            return false;
        }

        const cartOptionIds = (cartItem.option_ids || [])
            .slice()
            .sort();

        return (
            cartOptionIds.length === sortedOptionIds.length &&
            cartOptionIds.every(
                (id, index) => id === sortedOptionIds[index]
            )
        );
    });

    return cartItem ? cartItem.quantity : 0;
}

    async function increaseMenuItem(item) {
        const currentQuantity =
            getMenuItemQuantity(item.item_id);

        if (currentQuantity === 0) {
            await addToCart(item.item_id);
            return;
        }

        const cartItem = cart.items.find(
            (cartItem) =>
                cartItem.menu_item_id === item.item_id
        );

        if (!cartItem) {
            return;
        }

        await updateCartQuantity(
            cartItem.cart_item_id,
            currentQuantity + 1
        );
    }


    async function decreaseMenuItem(item) {
        const cartItem = cart?.items?.find(
            (cartItem) =>
                cartItem.menu_item_id === item.item_id
        );

        if (!cartItem) {
            return;
        }

        if (cartItem.quantity === 1) {
            await removeFromCart(
                cartItem.cart_item_id
            );
            return;
        }

        await updateCartQuantity(
            cartItem.cart_item_id,
            cartItem.quantity - 1
        );
    }


    async function logout() {

        try {

            await apiFetch(
                "/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(error);

        } finally {

            navigate("/login");
        }
    }

    async function openProfile() {
        setShowProfile(true);
        setProfileError("");
        setProfileLoading(true);

        try {
            const data = await apiFetch("/customer/profile");
            setProfile(data);
        } catch (error) {
            setProfileError(
                error.data?.detail ||
                error.message ||
                "Failed to load profile"
            );
        } finally {
            setProfileLoading(false);
        }
    }

    async function openProfile() {
        setShowProfile(true);
        setIsEditingProfile(false);
        setProfileError("");
        setProfileLoading(true);

        try {
            const data = await apiFetch("/customer/profile");

            setProfile(data);

            setProfileForm({
                customer_name: data.customer_name || "",
                phone: data.phone || ""
            });

        } catch (error) {
            setProfileError(
                error.data?.detail ||
                error.message ||
                "Failed to load profile"
            );
        } finally {
            setProfileLoading(false);
        }
    }

    async function saveProfileChanges() {
        if (!profile) return;

        setProfileSaving(true);
        setProfileError("");

        try {
            const changes = {};

            if (
                profileForm.customer_name.trim() !==
                (profile.customer_name || "")
            ) {
                changes.customer_name =
                    profileForm.customer_name.trim();
            }

            if (
                profileForm.phone.trim() !==
                (profile.phone || "")
            ) {
                changes.phone =
                    profileForm.phone.trim();
            }

            if (Object.keys(changes).length === 0) {
                setProfileError("No changes were made.");
                return;
            }

            const updatedProfile = await apiFetch(
                "/customer/profile",
                {
                    method: "PUT",
                    body: JSON.stringify(changes)
                }
            );

            setProfile(updatedProfile);

            setProfileForm({
                customer_name:
                    updatedProfile.customer_name || "",
                phone:
                    updatedProfile.phone || ""
            });

            setIsEditingProfile(false);

        } catch (error) {
            setProfileError(
                error.data?.detail ||
                error.message ||
                "Failed to update profile"
            );
        } finally {
            setProfileSaving(false);
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

    async function loadPendingOrderCount() {

        try {
            const data = await apiFetch(
    "/customer/orders/pending-count"
);

           

            console.log("CUSTOMER ORDERS:", data);
            const pendingCount = data.filter(
                (order) => order.status === "pending"
            ).length;

            setPendingOrderCount(pendingCount);

        } catch (error) {
            console.error(
                "Failed to load order count:",
                error
            );
        }
    }

    function useCurrentLocation() {

        console.log("USE CURRENT LOCATION CALLED");

        setLocationError("");
        setLocationLoading(true);

        if (!navigator.geolocation) {

            console.log("GEOLOCATION NOT SUPPORTED");

            setLocationError(
                "Geolocation is not supported by your browser."
            );

            setLocationLoading(false);

            return;
        }

        console.log("REQUESTING LOCATION");

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                console.log("LOCATION RECEIVED");
                console.log("LATITUDE:", latitude);
                console.log("LONGITUDE:", longitude);

                try {

                    const response = await fetch(
                        "http://127.0.0.1:8000/customer/addresses/reverse-geocode",
                        {
                            method: "POST",
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                latitude: latitude,
                                longitude: longitude
                            })
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.detail ||
                            "Unable to determine your address"
                        );
                    }

                    console.log(
                        "REVERSE GEOCODE RESULT:",
                        data
                    );

                    setAddressForm((previous) => ({
                        ...previous,

                        address_line1:
                            data.address_line1 ||
                            previous.address_line1,

                        city:
                            data.city ||
                            previous.city,

                        state:
                            data.state ||
                            previous.state,

                        pincode:
                            data.pincode ||
                            previous.pincode,

                        latitude: latitude,
                        longitude: longitude
                    }));

                } catch (error) {

                    console.error(
                        "REVERSE GEOCODING ERROR:",
                        error
                    );

                    setLocationError(
                        error.message ||
                        "Unable to determine your address"
                    );

                } finally {

                    setLocationLoading(false);
                }
            },

            (error) => {

                console.error(
                    "GEOLOCATION ERROR:",
                    error
                );

                setLocationError(
                    "Unable to get your current location. Please allow location access."
                );

                setLocationLoading(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
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

    async function searchFoodly(query) {
        const value = query.trim();
        if (!value) {
            setSearchResults(
                {
                    shops: [],
                    items: []
                }
            );
            setShowSearchResults(false);
            return
        }
        setSearchLoading(true);
        setShowSearchResults(true);

        try {
            const data = await apiFetch(
    `/customer/search?q=${encodeURIComponent(searchQuery)}`
);

            setSearchResults(data);
        } catch (error) {
            console.error("Search failed : ", error)
            setSearchResults(
                {
                    shops: [],
                    items: []
                }
            );
        } finally {
            setSearchLoading(false);
        }

    }

    return (

        <div className="customer-dashboard">
            <header className="customer-navbar">

                <div className="customer-navbar-container">
                    <span to="" className="logo">
                        Foodly
                        <img
                            src="/logo1.png"
                            alt="Foodly"
                            className="logo-icon"
                        />
                    </span>

                    <nav className="customer-nav-links">

                        <button
                            className="customer-orders-nav-btn"
                            onClick={() => navigate("/customer/orders")}
                        >
                            <span>Orders</span>

                            {pendingOrderCount > 0 && (
                                <span className="customer-orders-counter">
                                    {pendingOrderCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                document
                                    .getElementById("customer-cart")
                                    ?.scrollIntoView({
                                        behavior: "smooth"
                                    });
                            }}
                        >
                        🛒
                        </button>

                        <button
                            onClick={openProfile}
                        >
                            Profile
                        </button>

                    </nav>


                    <button
                        className="customer-logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </header>
            <section className="dashboard-header">
                <div className="home-search-wrapper">

                    <div className="home-search-box">

                        <span className="home-search-icon">
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search for food or restaurants"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            onFocus={() => {
                                if (searchQuery.trim()) {
                                    setShowSearchResults(true);
                                }
                            }}
                        />

                        {searchQuery && (
                            <button
                                type="button"
                                className="home-search-clear"
                                onClick={() => {
                                    setSearchQuery("");

                                    setSearchResults({
                                        shops: [],
                                        items: [],
                                    });

                                    setShowSearchResults(false);
                                }}
                            >
                                ×
                            </button>
                        )}

                    </div>


                    {showSearchResults && (
                        <div className="home-search-dropdown">

                            {searchLoading ? (

                                <div className="search-dropdown-loading">
                                    Searching...
                                </div>

                            ) : (

                                <>
                                    {searchResults.shops.length > 0 && (
                                        <div className="search-result-group">

                                            <span className="search-result-heading">
                                                SHOPS
                                            </span>

                                            {searchResults.shops.map((shop) => (

                                                <button
                                                    type="button"
                                                    key={shop.shop_id}
                                                    className="search-result-item"
                                                    onClick={() => {
                                                        setShowSearchResults(false);
                                                        setSearchQuery("");

                                                        setSearchedItemId(null);

                                                        viewShopMenu(
                                                            shop.shop_id
                                                        );
                                                    }}
                                                >

                                                    <div>

                                                        <strong>
                                                            {shop.shop_name}
                                                        </strong>

                                                        <span>
                                                            Restaurant
                                                        </span>

                                                    </div>

                                                    <span className="search-result-arrow">
                                                        →
                                                    </span>

                                                </button>

                                            ))}

                                        </div>
                                    )}


                                    {searchResults.items.length > 0 && (
                                        <div className="search-result-group">

                                            <span className="search-result-heading">
                                                FOOD
                                            </span>

                                            {searchResults.items.map((item) => (

                                                <button
                                                    type="button"
                                                    key={item.item_id}
                                                    className="search-result-item"
                                                    onClick={() => {
                                                        setShowSearchResults(false);
                                                        setSearchQuery("");

                                                        setSearchedItemId(
                                                            item.item_id
                                                        );

                                                        viewShopMenu(
                                                            item.shop_id
                                                        );
                                                    }}
                                                >

                                                    <div>

                                                        <strong>
                                                            {item.item_name}
                                                        </strong>

                                                        <span>
                                                            {item.shop_name}
                                                        </span>

                                                    </div>

                                                    <span className="search-result-arrow">
                                                        →
                                                    </span>

                                                </button>

                                            ))}

                                        </div>
                                    )}


                                    {searchResults.shops.length === 0 &&
                                        searchResults.items.length === 0 && (

                                            <div className="search-dropdown-empty">
                                                No results found
                                            </div>

                                        )}

                                </>

                            )}

                        </div>
                    )}

                </div>
                <div>
                    <span className="eyebrow">
                        DISCOVER
                    </span>

                    <h1>
                        Find your next meal
                    </h1>

                    <p>
                        Explore restaurants and
                        discover something delicious.
                    </p>
                </div>

            </section>

      {!selectedShop && (
        <>
       <FeaturedItemsCarousel
    onAddToCart={(item) =>
        addToCart(
            item.item_id,
            [],
            1,
            {},
            item.shop_name
        )
    }
/>
   <SpecialOffers
    onOfferClick={async (shopId, offerId) => {
        setActiveOfferId(offerId);
        setSearchedItemId(null);
        await viewShopMenu(shopId);
    }}
/>
</>
)}

            {!selectedShop ? (
                <section className="dashboard-shops">

                    <div className="section-heading">

                        <span className="eyebrow">
                            DISCOVER
                        </span>

                        <h2>
                            Available Shops
                        </h2>

                        <p>
                            Browse shops and explore their menus.
                        </p>
                        <div className="menu-top-bar">
                            <button
                                className="cart_button"
                                onClick={() => {
                                    document
                                        .getElementById("customer-cart")
                                        ?.scrollIntoView({
                                            behavior: "smooth"
                                        });
                                }}
                            >
                                Go to Cart
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <p className="status-text">
                            Loading shops...
                        </p>
                    )}

                    {error && (
                        <p className="error-text">
                            {error}
                        </p>
                    )}

                    {!loading &&
                        !error &&
                        shops.length === 0 && (
                            <div className="empty-state">
                                <h3>
                                    No shops available
                                </h3>

                                <p>
                                    Please check again later.
                                </p>
                            </div>
                        )
                    }

                    <div className="foodly-shops-grid">

                        {visibleShops.map(shop => {
    const randomCategories = [...(shop.categories || [])]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    return (

<article
    key={shop.shop_id}
    className="foodly-shop-card"
>

    <div className="foodly-shop-image">

        {shop.image_url ? (
    <img
        src={`http://127.0.0.1:8000${shop.image_url}`}
        alt={shop.shop_name}
        className="foodly-shop-image-photo"
        onError={(event) => {
            event.currentTarget.style.display = "none";
        }}
    />
) : (
    <span className="foodly-shop-image-placeholder">
        {shop.shop_name.charAt(0).toUpperCase()}
    </span>
)}

<span className="foodly-shop-open-badge">
    <span className="foodly-shop-open-dot"></span>
    Open
</span>

    </div>

    <div className="foodly-shop-content">

        <div className="foodly-shop-heading">

            <h3>
                {shop.shop_name}
            </h3>

        </div>
        {randomCategories.length > 0 && (
    <div className="foodly-shop-category-tags">
        {randomCategories.map((category, index) => (
            <span
                key={`${shop.shop_id}-${category}-${index}`}
                className="foodly-shop-category-tag"
            >
                {category}
            </span>
        ))}
    </div>
)}

        <p
    className="foodly-shop-description"
    title={shop.description || "Delicious food awaits."}
>
    {shop.description ||
        "Delicious food awaits."}
</p>

        {(shop.city || shop.address_line1) && (
            <div className="foodly-shop-location">

                <img
                    src="/location_image.png"
                    alt="Location"
                    className="foodly-shop-location-icon"
                />

                <span>
                    {shop.address_line1
                        ? `${shop.address_line1}, `
                        : ""}
                    {shop.city}
                </span>

            </div>
        )}

        <div className="foodly-shop-meta">

            {shop.distance_km != null && (
                <span className="foodly-shop-distance">
                    {shop.distance_km.toFixed(1)} km away
                </span>
            )}

            {shop.delivery_available && (
                <span className="foodly-shop-delivery">
                    Delivery available
                </span>
            )}

        </div>

        <button
            className="foodly-shop-menu-button"
            onClick={() =>
                viewShopMenu(shop.shop_id)
            }
        >
            View Menu
            <span>›</span>
        </button>

    </div>

 </article>
    );
})}

                    </div>
                    {totalShopPages > 1 && (
                        <div className="shop-pagination">

                            <button
                                className="shop-pagination-button"
                                disabled={currentShopPage === 1}
                                onClick={() =>
                                    setCurrentShopPage(
                                        currentShopPage - 1
                                    )
                                }
                            >
                                ‹
                            </button>

                            {Array.from(
                                { length: totalShopPages },
                                (_, index) => index + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    className={`shop-pagination-button ${currentShopPage === page
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        setCurrentShopPage(page)
                                    }
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="shop-pagination-button"
                                disabled={
                                    currentShopPage === totalShopPages
                                }
                                onClick={() =>
                                    setCurrentShopPage(
                                        currentShopPage + 1
                                    )
                                }
                            >
                                ›
                            </button>

                        </div>
                    )}

                </section>

            ) : (

                <section className="dashboard-menu">



                    <button
                        className="back-button"
                        onClick={backToShops}
                    >
                        ← Back to Shops
                    </button>

                    <div className="menu-top-bar">
                        <button
                            className="cart_button"
                            onClick={() => {
                                document
                                    .getElementById("customer-cart")
                                    ?.scrollIntoView({
                                        behavior: "smooth"
                                    });
                            }}
                        >
                            Go to Cart
                        </button>
                    </div>

                    <div className="menu-header">

                        <span className="eyebrow">
                            MENU
                        </span>

                        <h2>
                            {selectedShop.shop_name}
                        </h2>

                        <p>
                            {selectedShop.description ||
                                "Explore our menu."}
                        </p>

                    </div>


                    {menuLoading && (
                        <p className="status-text">
                            Loading menu...
                        </p>
                    )}


                    {!menuLoading &&
                        menu.map(category => (

                            <div
                                key={category.category_id}
                                className="menu-category"
                            >

                                <h3>
                                    {category.category_name}
                                </h3>

                                <div className="food-list">

                                    {category.items.map((item) => (

<div
    id={`searched-food-${item.item_id}`}
    key={item.item_id}
    className={`${item.has_options ? "config-food-card" : "food-card"} ${
    searchedItemId === item.item_id ||
    (activeOfferId && item.offer?.offer_id === activeOfferId)
        ? "searched-food-highlight"
        : ""
}`}
>

        {item.has_options ? (

            <>
                {/* =========================================
                    CONFIGURABLE FOOD ITEM
                    ========================================= */}

                <div className="config-food-main">

                    {/* Food Image */}
                    <div className="config-food-image">

                        {item.image_url ? (
                            <img
                                src={`http://127.0.0.1:8000${item.image_url}`}
                                alt={item.name}
                            />
                        ) : (
                            <div className="config-food-image-placeholder">
                                No Image
                            </div>
                        )}

                    </div>


                    {/* Food Information */}
                    <div className="config-food-info">

                        <h4>
                            {item.name}
                        </h4>

                        <p>
                            {item.description || "No description"}
                        </p>
                        {item.allow_parent_purchase && item.offer ? (
    <div className="customer-offer-price">
        <span className="customer-original-price">
            ₹{Number(item.offer.original_price).toFixed(2)}
        </span>

        <strong className="customer-discounted-price">
            ₹{Number(item.offer.offer_price).toFixed(2)}
        </strong>

        <span className="customer-discount-label">
            {item.offer.discount_label}
        </span>
    </div>
) : (
    item.allow_parent_purchase && (
        <strong>
            ₹{Number(item.price).toFixed(2)}
        </strong>
    )
)}

                    </div>


                    {/* Dropdown Button */}
                    {/* Parent Add Button */}

{item.allow_parent_purchase && (
    <button
        type="button"
        className="menu-add-button"
        onClick={() =>
            addToCart(item.item_id, [], 1)
        }
    >
        Add
    </button>
)}


{/* Add On's Button */}

<button
    type="button"
    className="config-options-button"
    onClick={() =>
        toggleItemOptions(item.item_id)
    }
    aria-label={
        expandedItems[item.item_id]
            ? "Hide addons"
            : "Show addons"
    }
>
    {item.allow_parent_purchase
        ? "Add On's"
        : expandedItems[item.item_id]
            ? "▲"
            : "▼"}
</button>

                </div>


                {/* =========================================
                    OPTIONS DROPDOWN
                    ========================================= */}

                {expandedItems[item.item_id] && (

                    <div className="config-options-panel">

                        {item.option_groups
                            ?.filter((group) => group.is_active)
                            .map((group) => (

                                <div
                                    key={group.group_id}
                                    className="config-option-group"
                                >

                                    {/* Group Header */}
                                    <div className="config-option-group-header">

                                        <strong>
                                            {group.name}
                                        </strong>

                                        {group.required && (
                                            <span className="config-required">
                                                Required
                                            </span>
                                        )}

                                    </div>


                                    {/* Options */}
                                    <div className="config-option-list">

                                        {group.options
                                            ?.filter(
                                                (option) =>
                                                    option.is_available
                                            )
                                            .map((option) => (

                                                <div
                                                    key={option.option_id}
                                                    className="config-option-item"
                                                >

                                                    {/* Option Information */}
                                                    <div className="config-option-info">

                                                        <span className="config-option-name">
                                                            {option.name}
                                                        </span>

                                                        <span className="config-option-price">
    {option.offer_price != null ? (
        <>
            <span className="customer-original-price">
                ₹{Number(option.price).toFixed(2)}
            </span>

            <strong className="customer-discounted-price">
                ₹{Number(option.offer_price).toFixed(2)}
            </strong>
        </>
    ) : (
        <>
            ₹{Number(option.price).toFixed(2)}
        </>
    )}
</span>
                                                    </div>


                                                    {/* Add / Quantity */}
{(() => {
    const isAddOption =
        group.price_mode === "ADD";

    const isReplaceOption =
        group.price_mode === "REPLACE";

    /* =========================================
       ADD MODE
       ========================================= */

    if (isAddOption) {

        const parentRow =
            findAddonParentRow(
                item.item_id,
                option.option_id
            );

        const addonOption =
            parentRow?.options?.find(
                (cartOption) =>
                    cartOption.option_id ===
                    option.option_id &&
                    cartOption.price_mode === "ADD"
            );

        const quantity =
            addonOption?.quantity ?? 0;


        /* -----------------------------------------
           ADD BUTTON
           ----------------------------------------- */

        if (quantity === 0) {

            return (
                <button
                    type="button"
                    className="config-add-button"
                    onClick={async () => {

                        if (parentRow) {

                            await updateCartOptionQuantity(
                                parentRow.cart_item_id,
                                option.option_id,
                                1
                            );

                        } else {

                            await addToCart(
                                item.item_id,
                                [option.option_id],
                                1,
                                {
                                    [option.option_id]: 1
                                }
                            );

                        }

                    }}
                >
                    Add
                </button>
            );
        }


        /* -----------------------------------------
           ADDON QUANTITY CONTROL
           ----------------------------------------- */

        return (
            <div className="config-quantity-control">

                <button
                    type="button"
                    className="config-quantity-button"
                    onClick={() =>
                        updateCartOptionQuantity(
                            parentRow.cart_item_id,
                            option.option_id,
                            quantity - 1
                        )
                    }
                >
                    −
                </button>


                <span className="config-quantity-value">
                    {quantity}
                </span>


                <button
                    type="button"
                    className="config-quantity-button"
                    onClick={() =>
                        updateCartOptionQuantity(
                            parentRow.cart_item_id,
                            option.option_id,
                            quantity + 1
                        )
                    }
                >
                    +
                </button>

            </div>
        );
    }


    /* =========================================
       REPLACE MODE
       ========================================= */

    if (isReplaceOption) {

        const variantRow =
            findVariantRow(
                item.item_id,
                option.option_id
            );

        const quantity =
            variantRow?.quantity ?? 0;


        /* -----------------------------------------
           ADD VARIANT
           ----------------------------------------- */

        if (quantity === 0) {

            return (
                <button
                    type="button"
                    className="config-add-button"
                    onClick={() =>
                        addToCart(
                            item.item_id,
                            [option.option_id],
                            1
                        )
                    }
                >
                    Add
                </button>
            );
        }


        /* -----------------------------------------
           VARIANT QUANTITY CONTROL
           ----------------------------------------- */

        return (
            <div className="config-quantity-control">

                <button
                    type="button"
                    className="config-quantity-button"
                    onClick={async () => {

                        if (quantity === 1) {

                            await removeFromCart(
                                variantRow.cart_item_id
                            );

                        } else {

                            await updateCartQuantity(
                                variantRow.cart_item_id,
                                quantity - 1
                            );

                        }

                    }}
                >
                    −
                </button>


                <span className="config-quantity-value">
                    {quantity}
                </span>


                <button
                    type="button"
                    className="config-quantity-button"
                    onClick={() =>
                        updateCartQuantity(
                            variantRow.cart_item_id,
                            quantity + 1
                        )
                    }
                >
                    +
                </button>

            </div>
        );
    }


    return null;

})()}

                                                </div>

                                            ))}

                                    </div>

                                </div>

                            ))}

                    </div>

                )}

            </>

        ) : (

            /* =========================================
               NORMAL FOOD ITEM
               ========================================= */

            <>
                <div className="food-item-image">

                    {item.image_url ? (
                            
                        <img
                            src={`http://127.0.0.1:8000${item.image_url}`}
                            alt={item.name}
                        />
                        
                    ) : (
                        <div className="food-item-image-placeholder">
                            No Image
                            
                        </div>
                    )}
                    
                 <span className="menu-item-rating-badge">
    <span className="menu-item-rating-star">★</span>
    <span>
        {item.average_rating != null
            ? item.average_rating.toFixed(1)
            : "5.0"}
    </span>
</span>

                </div>


                <div className="food-card-info">

                    <h4>
                        {item.name}
                    </h4>

                    <p>
                        {item.description || "No description"}
                    </p>

                    {item.offer ? (
    <div className="customer-offer-price">
        <span className="customer-original-price">
            ₹{Number(item.offer.original_price).toFixed(2)}
        </span>

        <strong className="customer-discounted-price">
            ₹{Number(item.offer.offer_price).toFixed(2)}
        </strong>

        <span className="customer-discount-label">
            {item.offer.discount_label}
        </span>
    </div>
) : (
    <strong>
        ₹{Number(item.price).toFixed(2)}
    </strong>
)}
{true && (
    <button
    type="button"
    className="food-item-reviews-link"
    onClick={() => setReviewItem(item)}
>
    💬 {item.review_count} review{item.review_count === 1 ? "" : "s"} ›
</button>
)}
                </div>


                {getMenuItemQuantity(item.item_id) === 0 ? (

                    <button
                        type="button"
                        className="menu-add-button"
                        onClick={() =>
                            addToCart(item.item_id)
                        }
                    >
                        Add
                    </button>

                ) : (

                    <div className="menu-quantity-control">

                        <button
                            type="button"
                            className="menu-quantity-button"
                            onClick={() =>
                                decreaseMenuItem(item)
                            }
                        >
                            −
                        </button>

                        <span className="menu-quantity-value">
                            {getMenuItemQuantity(item.item_id)}
                        </span>

                        <button
                            type="button"
                            className="menu-quantity-button"
                            onClick={() =>
                                increaseMenuItem(item)
                            }
                        >
                            +
                        </button>

                    </div>

                )}

            </>

        )}

    </div>

))}

                                </div>

                            </div>

                        ))}

                </section>




            )}
<Cart
    cart={cart}
    cartLoading={cartLoading}
    updateCartQuantity={updateCartQuantity}
    updateCartOptionQuantity={updateCartOptionQuantity}
    removeFromCart={removeFromCart}
    onCheckout={() => {
        setShowCheckout(true);

        if (selectedAddressId) {
            calculateDeliveryCharge(
                selectedAddressId
            );
        }
    }}
/>
            {cartConflict && (
                <div className="cart-conflict-overlay">

                    <div
                        className="cart-conflict-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="conflict-icon">
                            !
                        </div>

                        <h2>
                            Switch shop?
                        </h2>

                        <p>
                            Your cart currently contains items
                            from{" "}
                            <strong>
                                {cartConflict.currentShopName}
                            </strong>.
                        </p>

                        <p>
                            This item is from{" "}
                            <strong>
                                {cartConflict.requestedShopName}
                            </strong>.
                            Your current cart will be cleared
                            before adding this item.
                        </p>

                        <div className="cart-conflict-actions">

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setCartConflict(null)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={
                                    replaceCartAndAddItem
                                }
                            >
                                Replace
                            </button>

                        </div>

                    </div>

                </div>
            )}

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

            {showProfile && (
                <div className="customer-modal-overlay">

                    <div className="customer-profile-modal">

                        {/* Header */}
                        <div className="customer-profile-header">

                            <div>
                                <h2>
                                    {isEditingProfile
                                        ? "Edit Profile"
                                        : "My Profile"}
                                </h2>

                                <p>
                                    {isEditingProfile
                                        ? "Update your account information"
                                        : "Your Foodly account information"}
                                </p>
                            </div>

                            <button
                                className="customer-modal-close"
                                onClick={() => {
                                    setShowProfile(false);
                                    setIsEditingProfile(false);
                                    setProfileError("");
                                }}
                            >
                                ×
                            </button>

                        </div>


                        {/* Body */}
                        <div className="customer-profile-body">

                            {profileLoading ? (

                                <div className="profile-loading">
                                    Loading profile...
                                </div>

                            ) : profileError ? (

                                <p className="customer-profile-error">
                                    {profileError}
                                </p>

                            ) : profile ? (

                                isEditingProfile ? (

                                    /* =========================
                                       EDIT MODE
                                       ========================= */

                                    <div className="profile-edit-form">

                                        <div className="profile-form-group">

                                            <label>
                                                Customer Name
                                            </label>

                                            <input
                                                type="text"
                                                name="customer_name"
                                                value={
                                                    profileForm.customer_name
                                                }
                                                onChange={(event) =>
                                                    setProfileForm(
                                                        (previous) => ({
                                                            ...previous,
                                                            customer_name:
                                                                event.target.value
                                                        })
                                                    )
                                                }
                                            />

                                        </div>


                                        <div className="profile-form-group">

                                            <label>
                                                Phone
                                            </label>

                                            <input
                                                type="tel"
                                                name="phone"
                                                value={
                                                    profileForm.phone
                                                }
                                                onChange={(event) =>
                                                    setProfileForm(
                                                        (previous) => ({
                                                            ...previous,
                                                            phone:
                                                                event.target.value
                                                        })
                                                    )
                                                }
                                            />

                                        </div>

                                    </div>

                                ) : (

                                    /* =========================
                                       VIEW MODE
                                       ========================= */

                                    <div className="profile-view">

                                        <div className="profile-field">

                                            <span>
                                                Customer Name
                                            </span>

                                            <strong>
                                                {profile.customer_name ||
                                                    "Not provided"}
                                            </strong>

                                        </div>


                                        <div className="profile-field">

                                            <span>
                                                Phone
                                            </span>

                                            <strong>
                                                {profile.phone ||
                                                    "Not provided"}
                                            </strong>

                                        </div>


                                        <div className="profile-field">

                                            <span>
                                                Customer ID
                                            </span>

                                            <strong>
                                                {profile.customer_id}
                                            </strong>

                                        </div>
                                        <div className="profile-address-section">

                                            <span className="profile-section-label">
                                                DELIVERY ADDRESS
                                            </span>

                                            {addresses.length === 0 ? (

                                                <div className="profile-address-empty">
                                                    <span>Not yet added</span>
                                                </div>

                                            ) : (

                                                <div className="profile-address-card">

                                                    {(() => {
                                                        const defaultAddress =
                                                            addresses.find(
                                                                (address) => address.is_default
                                                            ) || addresses[0];

                                                        return (
                                                            <>
                                                                <div className="profile-address-top">

                                                                    <strong>
                                                                        {defaultAddress.address_line1}
                                                                    </strong>

                                                                    {defaultAddress.is_default && (
                                                                        <span className="default-badge">
                                                                            Default
                                                                        </span>
                                                                    )}

                                                                </div>

                                                                {defaultAddress.address_line2 && (
                                                                    <p>
                                                                        {defaultAddress.address_line2}
                                                                    </p>
                                                                )}

                                                                <p>
                                                                    {defaultAddress.city},{" "}
                                                                    {defaultAddress.state} -{" "}
                                                                    {defaultAddress.pincode}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                )

                            ) : null}

                        </div>


                        {/* Footer */}
                        {isEditingProfile && showAddAddress && (
                            <div className="profile-add-address-form">

                                <div className="profile-add-address-header">

                                    <h3>Add New Address</h3>

                                    <button
                                        type="button"
                                        className="profile-address-close-btn"
                                        onClick={() => setShowAddAddress(false)}
                                    >
                                        ×
                                    </button>

                                </div>

                                {addressFormError && (
                                    <p className="profile-address-error">
                                        {addressFormError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="use-location-btn"
                                    onClick={useCurrentLocation}
                                    disabled={locationLoading}
                                >
                                    {locationLoading
                                        ? "Getting your location..."
                                        : "📍 Use My Current Location"}
                                </button>

                                {locationError && (
                                    <p className="profile-address-error">
                                        {locationError}
                                    </p>
                                )}

                                <input
                                    type="text"
                                    placeholder="Address Line 1"
                                    value={addressForm.address_line1}
                                    onChange={(event) =>
                                        setAddressForm({
                                            ...addressForm,
                                            address_line1: event.target.value
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
                                            address_line2: event.target.value
                                        })
                                    }
                                />

                                <div className="profile-address-row">

                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={addressForm.city}
                                        onChange={(event) =>
                                            setAddressForm({
                                                ...addressForm,
                                                city: event.target.value
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
                                                state: event.target.value
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
                                            pincode: event.target.value
                                        })
                                    }
                                />

                                <label className="profile-default-address">

                                    <input
                                        type="checkbox"
                                        checked={addressForm.is_default}
                                        onChange={(event) =>
                                            setAddressForm({
                                                ...addressForm,
                                                is_default: event.target.checked
                                            })
                                        }
                                    />

                                    <span>Set as default address</span>

                                </label>

                                <button
                                    type="button"
                                    className="profile-save-address-btn"
                                    onClick={saveAddress}
                                    disabled={addressSaving}
                                >
                                    {addressSaving
                                        ? "Saving..."
                                        : "Save Address"}
                                </button>

                            </div>
                        )}


                        {/* Footer */}
                        <div className="customer-profile-footer">

                            {isEditingProfile ? (

                                <>
                                    <button
                                        className="profile-add-address-btn"
                                        onClick={() => {
                                            setShowAddAddress(true);
                                            setAddressFormError("");
                                        }}
                                    >
                                        + Add Address
                                    </button>

                                    <button
                                        className="profile-cancel-btn"
                                        onClick={() => {

                                            setIsEditingProfile(false);
                                            setShowAddAddress(false);
                                            setProfileError("");

                                            setProfileForm({
                                                customer_name:
                                                    profile.customer_name || "",
                                                phone:
                                                    profile.phone || ""
                                            });

                                        }}
                                        disabled={profileSaving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="profile-save-btn"
                                        onClick={saveProfileChanges}
                                        disabled={profileSaving}
                                    >
                                        {profileSaving
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>
                                </>

                            ) : (

                                <button
                                    className="profile-edit-btn"
                                    onClick={() =>
                                        setIsEditingProfile(true)
                                    }
                                >
                                    Edit Profile
                                </button>

                            )}

                        </div>

                    </div>

                </div>
            )}
            {reviewItem && (
  <ReviewModal
    item={reviewItem}
    onClose={() => setReviewItem(null)}
    onReviewUpdated={(updatedData) => {
        const updatedReviewCount =
            updatedData.summary.review_count;

        const updatedAverageRating =
            updatedData.summary.average_rating;

        setMenu((previousMenu) =>
            previousMenu.map((menuItem) =>
                menuItem.item_id === reviewItem.item_id
                    ? {
                          ...menuItem,
                          review_count: updatedReviewCount,
                          average_rating: updatedAverageRating,
                      }
                    : menuItem
            )
        );

        setReviewItem((previousItem) =>
            previousItem
                ? {
                      ...previousItem,
                      review_count: updatedReviewCount,
                      average_rating: updatedAverageRating,
                  }
                : previousItem
        );
    }}
/>
)}
        </div>
    )
}
export default CustomerDashboard;