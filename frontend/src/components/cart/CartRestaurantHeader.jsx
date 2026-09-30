function CartRestaurantHeader({
    cart,
    shops = [],
    onViewRestaurant,
}) {
    const shop = shops.find((item) => item.shop_id === cart.shop_id);
    const imageUrl = shop?.image_url;

    return (
        <div className="cartpage-restaurant-header">
            <div className="cartpage-restaurant-info">
                {imageUrl ? (
                    <img
                        className="cartpage-restaurant-image"
                        src={
                            imageUrl.startsWith("http")
                                ? imageUrl
                                : `http://127.0.0.1:8000${imageUrl}`
                        }
                        alt={cart.shop_name}
                    />
                ) : (
                    <div className="cartpage-restaurant-placeholder">
                        {cart.shop_name?.charAt(0)?.toUpperCase() || "F"}
                    </div>
                )}

                <div>
                    <h3>{cart.shop_name}</h3>
                    <p>
                        {cart.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                        )}{" "}
                        items
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="cartpage-secondary-button"
                onClick={onViewRestaurant}
            >
                View Restaurant ↗
            </button>
        </div>
    );
}

export default CartRestaurantHeader;
