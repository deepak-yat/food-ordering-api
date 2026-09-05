import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import ShopCard from "../components/ShopCard";
import FoodCard from "../components/FoodCard";

import { apiFetch } from "../api/client";

function Home() {

    const [shops, setShops] = useState([]);

    const [selectedShop, setSelectedShop] =
        useState(null);

    const [menu, setMenu] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [menuLoading, setMenuLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState({
        shops:[],
        items : [],
    });
    const [searchLoading, setSearchLoading] = useState(false);
    const [ showSearchResults, setShowSearchResults] = useState(false);
const [searchedItemId, setSearchedItemId] = useState(null);
    useEffect(() => {
        loadShops();
    }, []);

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


    async function loadShops() {

        try {

            setLoading(true);

            const data = await apiFetch(
                "/customer/view-shop"
            );

            setShops(data);

        } catch (error) {

            console.error(error);

            setError(
                "Unable to load shops."
            );

        } finally {

            setLoading(false);
        }
    }


    async function viewShopMenu(shopId) {

        try {

            setMenuLoading(true);

            const shop = shops.find(
                item =>
                    item.shop_id === shopId
            );

            setSelectedShop(shop);

            const data = await apiFetch(
                `/customer/view-shop/${shopId}/menu`
            );

            setMenu(data);

if (searchedItemId) {
    setTimeout(() => {
        const element = document.getElementById(
            `searched-food-${searchedItemId}`
        );

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, 100);
}

        } catch (error) {

            console.error(error);

            setError(
                "Unable to load menu."
            );

        } finally {

            setMenuLoading(false);
        }
    }


    function closeMenu() {
        setSelectedShop(null);
        setMenu([]);
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
        <>

            <Navbar />

            <main>

                {/* HERO */}

                <section className="hero">

                    <div className="hero-content">

                        <span className="eyebrow">
                            GOOD FOOD. GOOD MOOD.
                        </span>

                        <h1>
                            Your favourite food,
                            <span>
                                delivered.
                            </span>
                        </h1>

                        <p>
                            Discover local shops,
                            explore their menus and
                            order the food you love.
                        </p>

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

    viewShopMenu(shop.shop_id);
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

    setSearchedItemId(item.item_id);

    viewShopMenu(item.shop_id);
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

                    </div>

                    <div className="hero-image">

                        <img
                            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85"
                            alt="Food"
                        />

                    </div>

                </section>


                {/* SHOPS */}

                <section
                    id="shops"
                    className="shops-section"
                >

                    <div className="section-heading">

                        <span className="eyebrow">
                            EXPLORE
                        </span>

                        <h2>
                            Popular Shops
                        </h2>

                        <p>
                            Find something delicious
                            from shops around you.
                        </p>

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
                            <p className="status-text">
                                No shops are available
                                right now.
                            </p>
                        )
                    }


                    <div className="shops-grid">

                        {shops.map(shop => (

                            <ShopCard
                                key={shop.shop_id}
                                shop={shop}
                                onViewMenu={
                                    viewShopMenu
                                }
                            />

                        ))}

                    </div>

                </section>


                {/* ABOUT */}

                <section
                    id="about"
                    className="about-section"
                >

                    <div>

                        <span className="eyebrow">
                            ABOUT FOODLY
                        </span>

                        <h2>
                            Simple food ordering.
                        </h2>

                    </div>

                    <p>
                        Foodly connects customers
                        with local shops through a
                        simple ordering experience.
                        Browse menus, build your cart
                        and place your order.
                    </p>

                </section>

            </main>


            {/* MENU MODAL */}

            {selectedShop && (

                <div
                    className="modal-overlay"
                    onClick={closeMenu}
                >

                    <div
                        className="menu-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>
                                <span className="eyebrow">
                                    MENU
                                </span>

                                <h2>
                                    {selectedShop.shop_name}
                                </h2>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeMenu}
                            >
                                ×
                            </button>

                        </div>


                        {menuLoading ? (

                            <p className="status-text">
                                Loading menu...
                            </p>

                        ) : (

                            <div>

                                {menu.map(category => (

                                    <div
                                        className="menu-category"
                                        key={
                                            category.category_id
                                        }
                                    >

                                        <h3>
                                            {
                                                category.category_name
                                            }
                                        </h3>

                                        {category.items.map(
                                            item => (
<div
    key={item.item_id}
    id={`searched-food-${item.item_id}`}
    className={
        searchedItemId === item.item_id
            ? "searched-food-highlight"
            : ""
    }
>
                                                <FoodCard
                                                    key={
                                                        item.item_id
                                                    }
                                                    item={item}
                                                    onAdd={() => {
                                                        /*
                                                         * Authentication/
                                                         * cart flow will
                                                         * be connected next.
                                                         */
                                                        window.location.href =
                                                            "/login";
                                                    }}
                                                />
</div>
                                            )
                                        )}

                                    </div>

                                ))}

                            </div>
                        )}

                    </div>

                </div>

            )}

        </>
    );
}

export default Home;