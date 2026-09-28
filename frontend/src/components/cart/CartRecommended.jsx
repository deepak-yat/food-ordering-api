function formatPrice(value) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function CartRecommended({
    menu = [],
    selectedShop,
    cart,
    onAdd,
}) {
   if (!cart || !menu.length) {
    return null;
}

    const cartItemIds = new Set(
        cart.items.map((item) => item.menu_item_id)
    );

    const recommendations = menu
        .flatMap((category) => category.items || [])
        .filter((item) => !cartItemIds.has(item.item_id))
        .slice(0, 4);
 
    if (!recommendations.length) {
        return null;
    }

    return (
        <section className="cartpage-recommended">
            <div className="cartpage-recommended-heading">
                <h3>★ You might also like</h3>
            </div>

            <div className="cartpage-recommended-grid">
                {recommendations.map((item) => {
                    const imageUrl = item.image_url;

                    return (
                        <article
                            key={item.item_id}
                            className="cartpage-recommended-card"
                        >
                            {imageUrl ? (
                                <img
                                    src={
                                        imageUrl.startsWith("http")
                                            ? imageUrl
                                            : `http://127.0.0.1:8000${imageUrl}`
                                    }
                                    alt={item.name}
                                />
                            ) : (
                                <div className="cartpage-recommended-placeholder">
                                    No Image
                                </div>
                            )}

                            <div className="cartpage-recommended-content">
                                <h4>{item.name}</h4>
                                <span>{formatPrice(item.price)}</span>

                                <button
                                    type="button"
                                    onClick={() => onAdd(item.item_id)}
                                >
                                    Add
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

export default CartRecommended;
