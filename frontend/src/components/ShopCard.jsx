function ShopCard({ shop, onViewMenu }) {
    return (
        <article className="shop-card">

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
                        onViewMenu(shop.shop_id)
                    }
                >
                    View Menu
                </button>

            </div>

        </article>
    );
}

export default ShopCard;