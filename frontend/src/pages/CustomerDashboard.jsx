import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

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

    const [selectedShop, setSelectedShop] = useState(null);
    const [menu, setMenu] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [cartConflict, setCartConflict] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [profileForm, setProfileForm] = useState({
        customer_name: "",
        phone: ""
    });
    const [currentShopPage, setCurrentShopPage] = useState(1);

const shopsPerPage = 6;

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
        latitude : null,
        longitude : null
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
        loadShops();
        loadCart();
        loadAddresses();
    }, []);

useEffect(() => {
    if (showCheckout && selectedAddressId) {
        calculateDeliveryCharge(selectedAddressId);
    }
}, [showCheckout]);

    async function loadShops() {
        try {
            const data = await apiFetch(
                "/customer/view-shop"
            );
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
        setError("");
    }

    async function addToCart(itemId) {
        try {
            await apiFetch(
                "/customer/cart/items",
                {
                    method: "POST",
                    body: JSON.stringify({
                        menu_item_id: itemId,
                        quantity: 1
                    })
                }
            );

            await loadCart();

            setError("");

        } catch (error) {
            console.error(error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 409) {
                const conflict = error.data?.detail;

                setCartConflict({
                    itemId: itemId,
                    currentShopName:
                        conflict?.current_shop_name,
                    requestedShopName:
                        conflict?.requested_shop_name
                });

                return;
            }

            setError(
                error.message ||
                "Unable to add item to cart"
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
                        quantity: 1
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
            const response = await fetch(
                "http://127.0.0.1:8000/customer/addresses",
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load addresses");
            }

            const data = await response.json();

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
            const response = await fetch(
                "http://127.0.0.1:8000/customer/addresses",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(addressForm),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to save address"
                );
            }

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
                latitude : null,
                longitude : null
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
            const response = await fetch(
                "http://127.0.0.1:8000/customer/orders",
                {
                    credentials: "include",
                }
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json();
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


    async function calculateDeliveryCharge(addressId){
        if(!cart || !addressId){
            return;
        }
        setDeliveryLoading(true);
        setDeliveryError(""); 
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/customer/delivery-charge",
                {
                    method: "POST",
                    credentials:"include",
                    headers:{
                        "Content-Type" : "application/json"
                    },
                    body: JSON.stringify({
                        shop_id:cart.shop_id,
                        address_id:addressId
                    })
                }
            );
            const data = await response.json();
            if(!response.ok){
                throw new Error(
                    data.detail ||
                    "Unable to calculate delivery charge"
                );
            }   
            setDeliveryCharge(data);
        } catch (error){
            console.error(
                "Delivery Charge Error :",
                error
            );
             setDeliveryCharge(null);

        setDeliveryError(
            error.message ||
            "Unable to calculate delivery charge"
        );
        }finally {

        setDeliveryLoading(false);
    }
        
    }

    async function searchFoodly(query){
        const value = query.trim();
        if(!value) {
            setSearchResults(
                {
                    shops:[],
                    items:[]
                }
            );
            setShowSearchResults(false);
            return
        }
        setSearchLoading(true);
        setShowSearchResults(true);

        try{
            const response = await fetch(
            `http://127.0.0.1:8000/customer/search?q=${encodeURIComponent(value)}`,
            {
                credentials: "include",
            }
        );

        const data = await response.json();

        if (!response.ok){
            throw newError(
                data.detail || "search failed"
            );
        }
        setSearchResults(data);
        } catch (error){
            console.error("Search failed : ",error)
            setSearchResults(
                {
                    shops:[],
                    items:[]
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
                            Cart
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

                    <div className="shops-grid">

                        {visibleShops.map(shop => (

                            <article
                                key={shop.shop_id}
                                className="shop-card"
                            >

                                <div className="shop-image">

                                    <span>
                                        {shop.shop_name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>

                                </div>

                                <div className="shop-card-content">

                                    <div className="shop-title-row">

                                        <h3>
                                            {shop.shop_name}
                                        </h3>

                                        <span className="open-badge">
                                            Open
                                        </span>

                                    </div>

                                    <p>
                                        {shop.description ||
                                            "Delicious food awaits."}
                                    </p>

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            viewShopMenu(
                                                shop.shop_id
                                            )
                                        }
                                    >
                                        View Menu
                                    </button>

                                </div>

                            </article>

                        ))}

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
                className={`shop-pagination-button ${
                    currentShopPage === page
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

                                    {category.items.map(item => (

                                        <div
                                            key={item.item_id}
                                            className="food-card"
                                        >

                                            <div className="food-card-info">

                                                <h4>
                                                    {item.name}
                                                </h4>

                                                <p>
                                                    {item.description}
                                                </p>

                                                <strong>
                                                    ₹{Number(
                                                        item.price
                                                    ).toFixed(2)}
                                                </strong>

                                            </div>

                                            <button
                                                className="add-button"
                                                onClick={() => addToCart(item.item_id)}
                                            >
                                                Add
                                            </button>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        ))}

                </section>




            )}
            <section id="customer-cart" className="customer-cart">

                <div className="section-heading">

                    <span className="eyebrow">
                        YOUR CART
                    </span>

                    <h2>
                        Cart
                    </h2>

                    <p>
                        Review your selected items.
                    </p>

                </div>


                {cartLoading && (
                    <p className="status-text">
                        Loading cart...
                    </p>
                )}


                {!cartLoading && !cart && (
                    <div className="empty-state">

                        <h3>
                            Your cart is empty
                        </h3>

                        <p>
                            Browse a shop and add something
                            delicious.
                        </p>

                    </div>
                )}


                {!cartLoading && cart && (
                    <div className="cart-panel">
                        <div className="cart-shop-header">

                            <span className="eyebrow">
                                FROM
                            </span>

                            <h3>
                                {cart.shop_name}
                            </h3>

                        </div>

                        {cart.items.map(item => (

                            <div
                                key={item.cart_item_id}
                                className="cart-item"
                            >

                                <div className="cart-item-info">

                                    <h3>
                                        {item.name}
                                    </h3>

                                    <p>
                                        ₹{Number(
                                            item.unit_price
                                        ).toFixed(2)}
                                        {" "}×{" "}
                                        {item.quantity}
                                    </p>

                                </div>


                                <div className="cart-item-actions">

                                    <div className="quantity-control">

                                        <button
                                            onClick={() =>
                                                updateCartQuantity(
                                                    item.cart_item_id,
                                                    item.quantity - 1
                                                )
                                            }
                                            disabled={
                                                item.quantity <= 1
                                            }
                                        >
                                            −
                                        </button>

                                        <span>
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                updateCartQuantity(
                                                    item.cart_item_id,
                                                    item.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>


                                    <strong className="cart-item-price">
                                        ₹{Number(
                                            item.subtotal
                                        ).toFixed(2)}
                                    </strong>


                                    <button
                                        className="remove-button"
                                        onClick={() =>
                                            removeFromCart(
                                                item.cart_item_id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>

                                </div>

                            </div>

                        ))}


                        <div className="cart-summary">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹{Number(
                                    cart.total
                                ).toFixed(2)}
                            </strong>

                        </div>


                        <button
                            className="primary-button checkout-button"
                            onClick={() => {

    setShowCheckout(true);

    if (selectedAddressId) {
        calculateDeliveryCharge(
            selectedAddressId
        );
    }

}}
                        >
                            Continue to Checkout
                        </button>

                    </div>
                )}

            </section>
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
        </div>
    )
}
export default CustomerDashboard;