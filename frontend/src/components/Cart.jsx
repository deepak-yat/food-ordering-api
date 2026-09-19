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
{cart.items.map(item => {
    const variantOptions = (item.options ?? []).filter(
        (option) => option.price_mode === "REPLACE"
    );

    const addonOptions = (item.options ?? []).filter(
        (option) => option.price_mode === "ADD"
    );

    return (
        <div
            key={item.cart_item_id}
            className="cart-item"
        >

            <div className="cart-item-info">

                <h3>
                    {item.name}
                </h3>

                <p>
                    ₹{Number(item.unit_price).toFixed(2)}
                    {variantOptions.length > 0 && (
                        <>
                            {" · "}
                            {variantOptions
                                .map((option) => option.name)
                                .join(", ")}
                        </>
                    )}
                    {" × "}
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
                        disabled={item.quantity <= 1}
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
                    ₹{Number(item.subtotal).toFixed(2)}
                </strong>


                <button
                    className="remove-button"
                    onClick={() =>
                        removeFromCart(item.cart_item_id)
                    }
                >
                    Remove
                </button>

            </div>


            {addonOptions.length > 0 && (
                <div className="cart-item-options">

                    <span className="cart-options-label">
                        Add-ons
                    </span>

                    {addonOptions.map((option) => (

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

                                <div className="quantity-control">

                                    <button
                                        onClick={() =>
                                            updateCartOptionQuantity(
                                                item.cart_item_id,
                                                option.option_id,
                                                option.quantity - 1
                                            )
                                        }
                                        disabled={option.quantity <= 1}
                                    >
                                        −
                                    </button>

                                    <span>
                                        {option.quantity}
                                    </span>

                                    <button
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


                                <strong>
                                    ₹{Number(
                                        option.subtotal
                                    ).toFixed(2)}
                                </strong>


                                <button
                                    className="remove-button"
                                    onClick={() =>
                                        updateCartOptionQuantity(
                                            item.cart_item_id,
                                            option.option_id,
                                            0
                                        )
                                    }
                                >
                                    Remove
                                </button>

                            </div>

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
})}

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