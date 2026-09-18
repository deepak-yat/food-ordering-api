function OptionModal({
    show,
    mode,
    group,
    option,
    form,
    onChange,
    onClose,
    onSave,
    saving,
    error
}) {
    if (!show || !group) {
        return null;
    }

    const isEdit = mode === "edit";

    return (
        <div
            className="shop-modal-overlay"
            onClick={() => {
                if (!saving) {
                    onClose();
                }
            }}
        >
            <div
                className="shop-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                <div className="shop-modal-header">

                    <div>

                        <span className="eyebrow">
                            MENU OPTION
                        </span>

                        <h2>
                            {isEdit
                                ? "Edit Option"
                                : "Add Option"}
                        </h2>

                        <p>
                            {isEdit
                                ? (
                                    <>
                                        Update{" "}
                                        <strong>
                                            {option?.name}
                                        </strong>{" "}
                                        under{" "}
                                        <strong>
                                            {group.name}
                                        </strong>
                                    </>
                                )
                                : (
                                    <>
                                        Add an option to{" "}
                                        <strong>
                                            {group.name}
                                        </strong>
                                    </>
                                )}
                        </p>

                    </div>

                    <button
                        type="button"
                        className="shop-modal-close"
                        onClick={onClose}
                        disabled={saving}
                    >
                        ×
                    </button>

                </div>


                <div className="shop-modal-body">

                    <div className="form-group">

                        <label>
                            Option Name
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Quarter"
                            value={form.name}
                            onChange={(event) =>
                                onChange(
                                    "name",
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Price
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter option price"
                            value={form.price}
                            onChange={(event) =>
                                onChange(
                                    "price",
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Display Order
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={form.display_order}
                            onChange={(event) =>
                                onChange(
                                    "display_order",
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />

                    </div>


                    <div className="option-toggle-row">

                        <label className="option-toggle">

                            <input
                                type="checkbox"
                                checked={form.is_available}
                                onChange={(event) =>
                                    onChange(
                                        "is_available",
                                        event.target.checked
                                    )
                                }
                                disabled={saving}
                            />

                            <span className="custom-checkbox"></span>

                            <span className="option-toggle-text">
                                Available
                            </span>

                        </label>

                    </div>


                    {error && (
                        <p className="shop-form-error">
                            {error}
                        </p>
                    )}


                    <div className="shop-modal-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={onSave}
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : isEdit
                                    ? "Save Changes"
                                    : "Add Option"}
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default OptionModal;