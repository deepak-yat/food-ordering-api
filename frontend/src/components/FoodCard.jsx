function FoodCard({ item, onAdd }) {
    return (
        <div className="food-card">

            <div className="food-item-image">
                {item.image_url ? (
                    <img
                        src={`http://127.0.0.1:8000${item.image_url}`}
                        alt={item.name}
                    />
                ) : (
                    <div className="food-item-image-placeholder">
                        No Image
                    </div>
                )}
            </div>

            <div className="food-card-info">

                <h4>
                    {item.name}
                </h4>

                <p>
                    {item.description || "No description"}
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