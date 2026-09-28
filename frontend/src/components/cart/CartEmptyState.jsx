function CartEmptyState({ onContinueShopping }) {
    return (
        <div className="cartpage-empty-state">
            <div className="cartpage-empty-icon">🛒</div>

            <h2>Your Cart is Empty</h2>

            <p>
                Browse restaurants and add something delicious to your cart.
            </p>

            <button
                type="button"
                className="cartpage-empty-button"
                onClick={onContinueShopping}
            >
                Explore Restaurants
            </button>
        </div>
    );
}

export default CartEmptyState;
