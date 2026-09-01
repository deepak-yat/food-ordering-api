import {useEffect,useState} from "react";
import { apiFetch } from "../api/client";
import {
    useNavigate
} from "react-router-dom";
function CustomerDashboard(){
    const [shops,setShops] = useState([]);
    const[loading,setLoading] =  useState(true);
    const[error,setError] = useState("");
    const [selectedShop,setSelectedShop] = useState(null);
    const [menu, setMenu] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const navigate = useNavigate();
    const [cart,setCart] = useState(null);
    const [cartLoading, setCartLoading] = useState(true);
    const [cartConflict, setCartConflict] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);


    useEffect( () => {
        loadShops();
        loadCart();
    }, []);

    

    async function loadShops(){
        try{
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

    async function loadCart(){
        try{
            setCartLoading(true);
            const data = await apiFetch(
                "/customer/cart"
            );
            setCart(data);
        }catch(error){
            if(error.status === 404){
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
    ){
        if(quantity < 1){
            return;
        }
        try {
            await apiFetch(
                `/customer/cart/items/${cartItemId}`,
                {
                    method : "PUT",
                    body:JSON.stringify({
                        quantity:quantity
                    })
                }
            );
            await loadCart();
        }catch(error){
            console.error(error);

            setError(
                error.message ||
                "Unable to update quantity"
            );
        }
    } 

    async function removeFromCart(cartItemId){
        try{
            await apiFetch(
                `/customer/cart/items/${cartItemId}`,
                {
                    method:"DELETE"
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

    return (
        
        <div className="customer-dashboard">
<header className="customer-navbar">

    <div className="customer-navbar-container">

        <a
            href="/"
            className="customer-logo"
        >
            Foodly
        </a>


        <nav className="customer-nav-links">

            <button
                onClick={() => {
                    document
                        .getElementById("customer-orders")
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });
                }}
            >
                Orders
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
                onClick={() => {
                    document
                        .getElementById("customer-profile")
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });
                }}
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

            {shops.map(shop => (

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
    onClick={() => setShowCheckout(true)}
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


            <div className="checkout-total">

                <span>
                    Total
                </span>

                <strong>
                    ₹{Number(
                        cart.total
                    ).toFixed(2)}
                </strong>

            </div>


            <div className="checkout-address-section">

                <span className="eyebrow">
                    DELIVERY ADDRESS
                </span>

                <p className="status-text">
                    Delivery address support will be
                    connected here.
                </p>

            </div>


            <button
                className="primary-button checkout-place-button"
                disabled
            >
                Place Order
            </button>

        </div>

    </div>
)}

        </div>
    )
}
export default CustomerDashboard;