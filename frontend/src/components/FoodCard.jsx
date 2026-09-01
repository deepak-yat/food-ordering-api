function FoodCard({ item, onAdd }) {
    return (
        <div className="food-card">

            <div className="food-card-info">

                <h4>
                    {item.name}
                </h4>

                <p>
                    {item.description}
                </p>

                <strong>
                    ₹{Number(item.price).toFixed(2)}
                </strong>

            </div>

            <button
                className="add-button"
                onClick={() =>
                    onAdd(item.item_id)
                }
            >
                Add
            </button>

        </div>
    );
}

export default FoodCard;