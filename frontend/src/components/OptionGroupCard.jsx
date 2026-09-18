function OptionGroupCard({
    group,
    onEditGroup,
    onAddOption,
    onEditOption
}) {
    return (
        <div className="option-group-card">

            <div className="option-group-header">

                <div>
                    <div className="option-group-title-row">

                        <h4>{group.name}</h4>

                        <button
                            type="button"
                            className="option-edit-button"
                            onClick={() => onEditGroup(group)}
                        >
                            Edit
                        </button>

                    </div>

                    <span>
    {group.selection_type}
    {group.required ? " • Required" : " • Optional"}
</span>

<span className="option-group-pricing">
    {group.price_mode === "REPLACE"
        ? "Pricing: Replace item price"
        : "Pricing: Add to item price"}
</span>
                </div>

            </div>


            {group.options?.length > 0 ? (

                <div className="option-list">

                    {group.options.map((option) => (

                        <div
                            key={option.option_id}
                            className="option-row"
                        >

                            <div className="option-row-info">

                                <strong>
                                    {option.name}
                                </strong>

                                <span>
                                    ₹
                                    {Number(
                                        option.price
                                    ).toFixed(2)}
                                </span>

                            </div>


                            <button
                                type="button"
                                className="option-edit-button"
                                onClick={() =>
                                    onEditOption(
                                        group,
                                        option
                                    )
                                }
                            >
                                Edit
                            </button>

                        </div>

                    ))}

                </div>

            ) : (

                <p className="option-group-empty">
                    No options added yet.
                </p>

            )}


            <div className="option-group-footer">

                <button
                    type="button"
                    className="add-option-button"
                    onClick={() =>
                        onAddOption(group)
                    }
                >
                    + Add Option
                </button>

            </div>

        </div>
    );
}

export default OptionGroupCard;