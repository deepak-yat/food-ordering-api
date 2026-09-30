import { useNavigate } from "react-router-dom";
function CartEmptyState({ onContinueShopping }) {
    const navigate = useNavigate();
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
               onClick={() =>
                                navigate("/customer/dashboard")
                            }
            >
                Explore Restaurants
            </button>
        </div>
    );
}

export default CartEmptyState;
