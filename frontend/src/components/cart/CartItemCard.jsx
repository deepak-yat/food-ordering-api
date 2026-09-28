import CartOptionRow from "./CartOptionRow";

function formatPrice(value) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function CartItemCard({
    item,
    menuItemLookup,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
}) {
    const menuItem = menuItemLookup.get(item.menu_item_id);

    const variantOptions = (item.options ?? [])
        .filter((option) => option.price_mode === "REPLACE")
        .sort((a, b) => a.display_order - b.display_order);

    const addonOptions = (item.options ?? [])
        .filter((option) => option.price_mode === "ADD")
        .sort((a, b) => a.display_order - b.display_order);

    const imageUrl = menuItem?.image_url;

    return (
        <article className="cartpage-item-card">

            <div className="cartpage-item-top">

                {/* ITEM IMAGE */}
                {imageUrl ? (
                    <img
                        className="cartpage-item-image"
                        src={
                            imageUrl.startsWith("http")
                                ? imageUrl
                                : `http://127.0.0.1:8000${imageUrl}`
                        }
                        alt={item.name}
                    />
                ) : (
                    <div className="cartpage-item-image cartpage-image-placeholder">
                        No Image
                    </div>
                )}

                {/* ITEM DETAILS */}
                <div className="cartpage-item-content">

                    <div className="cartpage-item-heading">
                        <div>
                            <h3>{item.name}</h3>

                            {variantOptions.length > 0 && (
                                <div className="cartpage-variant-chips">
                                    {variantOptions.map((option) => (
                                        <span
                                            key={option.option_id}
                                            className="cartpage-variant-chip"
                                        >
                                            {option.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {menuItem?.description && (
                        <p className="cartpage-item-description">
                            {menuItem.description}
                        </p>
                    )}

                    <div className="cartpage-price-block">

                        {item.offer_id ? (
                            <>
                                <span className="cartpage-offer-label">
                                    🔥 {item.offer_title}
                                </span>

                                <div className="cartpage-offer-prices">

                                    <span className="cartpage-original-price">
                                        {formatPrice(
                                            item.original_unit_price
                                        )}
                                    </span>

                                    <strong>
                                        {formatPrice(item.unit_price)}
                                    </strong>

                                    <span className="cartpage-save-chip">
                                        Save{" "}
                                        {formatPrice(
                                            item.discount_per_unit
                                        )}
                                    </span>

                                </div>

                                <span className="cartpage-price-quantity">
                                    × {item.quantity}
                                </span>
                            </>
                        ) : (
                            <span>
                                {formatPrice(item.unit_price)} each
                            </span>
                        )}

                    </div>

                    {/* ADD-ONS */}
                    {addonOptions.length > 0 && (
                        <div className="cartpage-addons">

                            <div className="cartpage-addons-title">
                                Add-ons
                            </div>

                            {addonOptions.map((option) => (
                                <CartOptionRow
                                    key={option.option_id}
                                    option={option}
                                    cartItemId={item.cart_item_id}
                                    updateCartOptionQuantity={
                                        updateCartOptionQuantity
                                    }
                                />
                            ))}

                        </div>
                    )}

                </div>

                {/* RIGHT SIDE ACTIONS */}
                <div className="cartpage-item-footer">

                    <div className="cartpage-parent-actions">

                        <div className="cartpage-quantity-control">

                            <button
                                type="button"
                                disabled={item.quantity <= 1}
                                onClick={() =>
                                    updateCartQuantity(
                                        item.cart_item_id,
                                        item.quantity - 1
                                    )
                                }
                                aria-label={`Decrease ${item.name} quantity`}
                            >
                                −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    updateCartQuantity(
                                        item.cart_item_id,
                                        item.quantity + 1
                                    )
                                }
                                aria-label={`Increase ${item.name} quantity`}
                            >
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            className="cartpage-remove-button"
                            onClick={() =>
                                removeFromCart(item.cart_item_id)
                            }
                        >
                            Remove
                        </button>

                    </div>

                    {/* FAR RIGHT TOTAL */}
                    <div className="cartpage-item-breakdown">

                        

                        <strong>
                            {formatPrice(item.line_total)}
                        </strong>

                    </div>

                </div>

            </div>

        </article>
    );
}

export default CartItemCard;