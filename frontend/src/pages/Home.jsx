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

    useEffect(() => {
        loadShops();
    }, []);


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

                        <div className="hero-search">

                            <input
                                type="text"
                                placeholder="Search shops or food..."
                            />

                            <button className="primary-button">
                                Search
                            </button>

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