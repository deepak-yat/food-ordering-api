function ShopCard({ shop, onViewMenu }) {
    const randomCategories = [...(shop.categories || [])]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    return (
        <article className="foodly-shop-card">

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
                    <h3>{shop.shop_name}</h3>
                </div>

                {randomCategories.length > 0 && (
                    <div className="foodly-shop-category-tags">
                        {randomCategories.map(
                            (category, index) => (
                                <span
                                    key={`${shop.shop_id}-${category}-${index}`}
                                    className="foodly-shop-category-tag"
                                >
                                    {category}
                                </span>
                            )
                        )}
                    </div>
                )}

                <p
                    className="foodly-shop-description"
                    title={
                        shop.description ||
                        "Delicious food awaits."
                    }
                >
                    {shop.description ||
                        "Delicious food awaits."}
                </p>

                

                {(shop.city ||
                    shop.address_line1) && (
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
                        onViewMenu(shop.shop_id)
                    }
                >
                    View Menu
                    <span>›</span>
                </button>

            </div>

        </article>
    );
}

export default ShopCard;