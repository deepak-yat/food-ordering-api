function OptionGroupModal({
    show,
    group,
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
                            OPTION GROUP
                        </span>

                        <h2>
                            Edit Option Group
                        </h2>

                        <p>
                            Update the settings for{" "}
                            <strong>{group.name}</strong>
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
                            Group Name
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Portion"
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
                            Selection Type
                        </label>

                        <select
                            value={form.selection_type}
                            onChange={(event) =>
                                onChange(
                                    "selection_type",
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        >
                            <option value="SINGLE">
                                Single Selection
                            </option>

                            <option value="MULTIPLE">
                                Multiple Selection
                            </option>
                        </select>

                    </div>

<div className="form-group">
    <label>Pricing Behavior</label>

    <select
        value={form.price_mode}
        onChange={(event) =>
            onChange("price_mode", event.target.value)
        }
        disabled={saving}
    >
        <option value="ADD">
            Add to item price
        </option>

        <option value="REPLACE">
            Replace item price
        </option>
    </select>

    <p className="form-help-text">
        Choose whether selected options add to the item's
        base price or replace it.
    </p>
</div>


                    <div className="option-toggle-row">

                        <label className="option-toggle">

                            <input
                                type="checkbox"
                                checked={form.required}
                                onChange={(event) =>
                                    onChange(
                                        "required",
                                        event.target.checked
                                    )
                                }
                                disabled={saving}
                            />

                            <span className="custom-checkbox"></span>

                            <span className="option-toggle-text">
                                Required
                            </span>

                        </label>

                    </div>


                    <div className="form-row">

                        <div className="form-group">

                            <label>
                                Minimum Selection
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.min_selection}
                                onChange={(event) =>
                                    onChange(
                                        "min_selection",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Maximum Selection
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.max_selection}
                                onChange={(event) =>
                                    onChange(
                                        "max_selection",
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            />

                        </div>

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
                                : "Save Changes"}
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
}

export default OptionGroupModal;