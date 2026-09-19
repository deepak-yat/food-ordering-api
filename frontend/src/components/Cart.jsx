function Cart({
    cart,
    cartLoading,
    updateCartQuantity,
    updateCartOptionQuantity,
    removeFromCart,
    onCheckout
}) {
    return (
        <section id="customer-cart" className="customer-cart">

            <div className="section-heading">
                <span className="eyebrow">YOUR CART</span>
                <h2>Cart</h2>
                <p>Review your selected items.</p>
            </div>

            {cartLoading && (
                <p className="status-text">
                    Loading cart...
                </p>
            )}

            {!cartLoading && !cart && (
                <div className="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>
                        Browse a shop and add something delicious.
                    </p>
                </div>
            )}

            {!cartLoading && cart && (
                <div className="cart-panel">

                    {/* SHOP HEADER */}
                    <div className="cart-shop-header">
                        <span className="eyebrow">FROM</span>
                        <h3>{cart.shop_name}</h3>
                    </div>

                    {/* CART ITEMS */}
                    {cart.items.map((item) => (
                        <div
                            key={item.cart_item_id}
                            className="cart-item"
                        >

                            {/* PARENT ITEM */}
                            <div className="cart-item-main">

                                <div className="cart-item-info">
                                    <h3>{item.name}</h3>

                                    <p className="cart-item-base-price">
                                        ₹{Number(item.unit_price).toFixed(2)}
                                    </p>
                                </div>

                                <div className="cart-item-actions">

                                    {/* PARENT QUANTITY */}
                                    <div className="quantity-control">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (item.quantity > 1) {
                                                    updateCartQuantity(
                                                        item.cart_item_id,
                                                        item.quantity - 1
                                                    );
                                                }
                                            }}
                                            disabled={item.quantity <= 1}
                                        >
                                            −
                                        </button>

                                        <span>
                                            {item.quantity}
                                        </span>

                                        <button
                                            type="button"
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

                                    {/* PARENT SUBTOTAL */}
                                    <strong className="cart-item-price">
                                        ₹{Number(item.subtotal).toFixed(2)}
                                    </strong>

                                    {/* REMOVE */}
                                    <button
                                        type="button"
                                        className="remove-button"
                                        onClick={() =>
                                            removeFromCart(
                                                item.cart_item_id
                                            )
                                        }
                                        title="Remove item"
                                        aria-label={`Remove ${item.name}`}
                                    >
                                        🗑
                                    </button>

                                </div>
                            </div>

                            {/* ADD-ONS */}
                            {item.options && item.options.length > 0 && (
                                <div className="cart-item-options">

                                    <span className="cart-options-label">
                                        Add-ons
                                    </span>

                                    {item.options.map((option) => (
                                        <div
                                            key={option.option_id}
                                            className="cart-option"
                                        >

                                            <div className="cart-option-info">

                                                <h4>
                                                    {option.name}
                                                </h4>

                                                <p>
                                                    ₹{Number(option.price).toFixed(2)}
                                                    {" × "}
                                                    {option.quantity}
                                                </p>

                                            </div>

                                            <div className="cart-option-actions">

                                                {/* ADD-ON QUANTITY */}
                                                <div className="quantity-control">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCartOptionQuantity(
                                                                item.cart_item_id,
                                                                option.option_id,
                                                                option.quantity - 1
                                                            )
                                                        }
                                                        disabled={
                                                            option.quantity <= 1
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {option.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCartOptionQuantity(
                                                                item.cart_item_id,
                                                                option.option_id,
                                                                option.quantity + 1
                                                            )
                                                        }
                                                    >
                                                        +
                                                    </button>

                                                </div>

                                                {/* ADD-ON SUBTOTAL */}
                                                <strong>
                                                    ₹{Number(option.subtotal).toFixed(2)}
                                                </strong>

                                                {/* REMOVE ADD-ON */}
                                                <button
                                                    type="button"
                                                    className="remove-button option-remove-button"
                                                    onClick={() =>
                                                        updateCartOptionQuantity(
                                                            item.cart_item_id,
                                                            option.option_id,
                                                            0
                                                        )
                                                    }
                                                    title={`Remove ${option.name}`}
                                                    aria-label={`Remove ${option.name}`}
                                                >
                                                    🗑
                                                </button>

                                            </div>

                                        </div>
                                    ))}

                                </div>
                            )}

                        </div>
                    ))}

                    {/* CART TOTAL */}
                    <div className="cart-summary">
                        <span>Total</span>

                        <strong>
                            ₹{Number(cart.total).toFixed(2)}
                        </strong>
                    </div>

                    {/* CHECKOUT */}
                    <button
                        type="button"
                        className="primary-button checkout-button"
                        onClick={onCheckout}
                    >
                        Continue to Checkout
                    </button>

                </div>
            )}

        </section>
    );
}

export default Cart;