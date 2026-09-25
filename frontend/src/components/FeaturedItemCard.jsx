function FeaturedItemCard({ item, onAddToCart }) {
    const imageUrl = item.image_url
        ? `http://127.0.0.1:8000${item.image_url}`
        : null;

    return (
        <article className="featured-item-card">
            <div className="featured-item-image-wrapper">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.item_name}
                        className="featured-item-image"
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="featured-item-image-placeholder">
                        Foodly
                    </div>
                )}

                {item.offer_available && (
                    <span className="featured-item-discount-badge">
                        🔥 {item.discount_label}
                    </span>
                )}
            </div>

            <div className="featured-item-content">
                <h3 className="featured-item-name">
                    {item.item_name}
                </h3>

                <div className="featured-item-shop">
                    <span>{item.shop_name}</span>
                </div>

                <div className="featured-item-bottom">
                    <div className="featured-item-price">
                        {item.offer_available ? (
                            <>
                                <strong>
                                    ₹{Number(item.discounted_price).toFixed(0)}
                                </strong>

                                <span className="featured-item-original-price">
                                    ₹{Number(item.price).toFixed(0)}
                                </span>
                            </>
                        ) : (
                            <strong>
                                ₹{Number(item.price).toFixed(0)}
                            </strong>
                        )}
                    </div>

                    <button
                        type="button"
                        className="featured-item-cart-button"
                        aria-label={`Add ${item.item_name} to cart`}
                        onClick={() => onAddToCart(item)}
                    >
                        🛒
                    </button>
                </div>
            </div>
        </article>
    );
}

export default FeaturedItemCard;