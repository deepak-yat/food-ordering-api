function formatPrice(value) {
    return `₹${Number(value ?? 0).toFixed(2)}`;
}

function CartOptionRow({
    option,
    cartItemId,
    updateCartOptionQuantity,
}) {
    const quantity = Number(option.quantity ?? 0);

    return (
        <div className="cartpage-option-row">
            <div className="cartpage-option-info">
                <span className="cartpage-option-name">
                    {option.name}
                </span>

                <span className="cartpage-option-price">
                    {formatPrice(option.price)} × {quantity} ={" "}
                    <strong>{formatPrice(option.subtotal)}</strong>
                </span>
            </div>

            <div className="cartpage-option-actions">
                <div className="cartpage-quantity-control cartpage-option-quantity">
                    <button
                        type="button"
                        onClick={() =>
                            updateCartOptionQuantity(
                                cartItemId,
                                option.option_id,
                                Math.max(0, quantity - 1)
                            )
                        }
                        aria-label={`Decrease ${option.name} quantity`}
                    >
                        −
                    </button>

                    <span>{quantity}</span>

                    <button
                        type="button"
                        onClick={() =>
                            updateCartOptionQuantity(
                                cartItemId,
                                option.option_id,
                                quantity + 1
                            )
                        }
                        aria-label={`Increase ${option.name} quantity`}
                    >
                        +
                    </button>
                </div>

                <button
                    type="button"
                    className="cartpage-option-remove"
                    onClick={() =>
                        updateCartOptionQuantity(
                            cartItemId,
                            option.option_id,
                            0
                        )
                    }
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

export default CartOptionRow;
