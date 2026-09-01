import { useEffect , useState } from "react";
import {useNavigate} from "react-router-dom";

import {apiFetch} from "../api/client";
import {useAuth} from "../context/AuthContext";


function ShopDashboard(){

    const navigate = useNavigate();
    const {logout}=useAuth();

    const [orders,setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [items,setItems] = useState([]);

    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");
    const [expandedCategory, setExpandedCategory] =
    useState(null);

    const [showCategoryForm, setShowCategoryForm] = useState(false);

const [categoryName, setCategoryName] = useState("");

const [categoryLoading, setCategoryLoading] = useState(false);

const [categoryError, setCategoryError] = useState("");

    const [editingCategory, setEditingCategory] = useState(null);
const [deleteCategory, setDeleteCategory] = useState(null);
const [showItemForm, setShowItemForm] = useState(false);
const [selectedCategory, setSelectedCategory] = useState(null);

const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: ""
});

const [itemLoading, setItemLoading] = useState(false);
const [itemError, setItemError] = useState("");


    useEffect (()=>{
        loadDashboard();
    }, []);
    async function loadDashboard() {

        try {

            setLoading(true);
            setError("");

            const [
                orderData,
                categoryData,
                itemData
            ] = await Promise.all([
                apiFetch("/shop/orders"),
                apiFetch("/menu/categories"),
                apiFetch("/menu/categories/item")
            ]);

            setOrders(orderData);
            setCategories(categoryData);
            setItems(itemData);

        } catch (error) {

            console.error(error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/");
                return;
            }

            setError(
                error.message ||
                "Unable to load dashboard"
            );

        } finally {

            setLoading(false);
        }
    }



    async function handleLogout() {

        try {
            await logout();
        } finally {
            navigate("/login");
        }
    }

    
    async function addCategory(event){
        event.preventDefault();

        setCategoryError("");

        if (!categoryName.trim()){
            setCategoryError("Category name is required.");
            return;
        }

        try{
            setCategoryLoading(true);

            const newCategory = await apiFetch(
                "/menu/categories",
                {
                    method:"POST",
                    body:JSON.stringify(
                        {
                    category_name: categoryName.trim()
                }
                    )
                }
            );
             console.log("Category created:", newCategory);

        setCategories((currentCategories) => [
            ...currentCategories,
            newCategory
        ]);

        setCategoryName("");
        setShowCategoryForm(false);
        }catch (error) {
        console.error(error);

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setCategoryError(
            error.message ||
            "Unable to create category."
        );

    } finally {
        setCategoryLoading(false);
    }
    }

    async function updateCategory(event) {
    event.preventDefault();

    if (!editingCategory) {
        return;
    }

    if (!categoryName.trim()) {
        setCategoryError(
            "Category name is required."
        );
        return;
    }

    try {
        setCategoryLoading(true);
        setCategoryError("");

        const updatedCategory = await apiFetch(
            `/menu/categories/categories/${editingCategory.category_id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    category_name: categoryName.trim()
                })
            }
        );

        setCategories((currentCategories) =>
            currentCategories.map(category =>
                category.category_id ===
                editingCategory.category_id
                    ? {
                        ...category,
                        category_name:
                            updatedCategory.category_name
                    }
                    : category
            )
        );

        setEditingCategory(null);
        setCategoryName("");

    } catch (error) {
        console.error(error);

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setCategoryError(
            error.message ||
            "Unable to update category."
        );

    } finally {
        setCategoryLoading(false);
    }
}

async function confirmDeleteCategory() {

    if (!deleteCategory) {
        return;
    }

    try {
        setCategoryLoading(true);
        setCategoryError("");

        await apiFetch(
            `/menu/categories/categories/${deleteCategory.category_id}`,
            {
                method: "DELETE"
            }
        );

        setCategories((currentCategories) =>
            currentCategories.filter(
                category =>
                    category.category_id !==
                    deleteCategory.category_id
            )
        );

        /*
         * Also remove any items belonging
         * to this category from local state.
         */
        setItems((currentItems) =>
            currentItems.filter(
                item =>
                    item.category_id !==
                    deleteCategory.category_id
            )
        );

        setDeleteCategory(null);

    } catch (error) {
        console.error(error);

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setCategoryError(
            error.message ||
            "Unable to delete category."
        );

    } finally {
        setCategoryLoading(false);
    }
}

    async function addItem(event) {
    event.preventDefault();

    if (!selectedCategory) {
        return;
    }

    setItemError("");

    if (!itemForm.name.trim()) {
        setItemError("Item name is required.");
        return;
    }

    if (
        itemForm.price === "" ||
        Number(itemForm.price) <= 0
    ) {
        setItemError("Price must be greater than 0.");
        return;
    }

    try {

        setItemLoading(true);

        const newItem = await apiFetch(
            "/menu/categories/item",
            {
                method: "POST",
                body: JSON.stringify({
                    category_id:
                        selectedCategory.category_id,
                    name: itemForm.name.trim(),
                    description:
                        itemForm.description.trim() || null,
                    price: Number(itemForm.price)
                })
            }
        );

        setItems(currentItems => [
            ...currentItems,
            newItem
        ]);

        setItemForm({
            name: "",
            description: "",
            price: ""
        });

        setSelectedCategory(null);
        setShowItemForm(false);

    } catch (error) {

        console.error(error);

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setItemError(
            error.message ||
            "Unable to add item."
        );

    } finally {

        setItemLoading(false);
    }
}

    return (
        <div className="shop-dashboard">

            <header className="shop-navbar">

                <div className="shop-navbar-container">

                    <button
                        className="shop-brand"
                        onClick={() =>
                            navigate("/shop/dashboard")
                        }
                    >
                        Foodly
                    </button>


                    <nav className="shop-nav">

                        <button>
                            Overview
                        </button>

                        <button>
                            Menu
                        </button>

                        <button>
                            Orders
                        </button>

                    </nav>


                    <button
                        className="shop-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            <main className="shop-content">

                <section className="shop-welcome">

                    <span className="eyebrow">
                        SHOP OWNER
                    </span>

                    <h1>
                        Manage your shop
                    </h1>

                    <p>
                        Manage your menu and keep track
                        of incoming customer orders.
                    </p>

                </section>


                {error && (
                    <p className="error-text">
                        {error}
                    </p>
                )}


                <section className="shop-stats">

                    <div className="shop-stat-card">

                        <span>
                            Pending Orders
                        </span>

                        <strong>
                            {
                                orders.filter(
                                    order =>
                                        order.status ===
                                        "pending"
                                ).length
                            }
                        </strong>

                    </div>


                    <div className="shop-stat-card">

                        <span>
                            Categories
                        </span>

                        <strong>
                            {categories.length}
                        </strong>

                    </div>


                    <div className="shop-stat-card">

                        <span>
                            Menu Items
                        </span>

                        <strong>
                            {items.length}
                        </strong>

                    </div>

                </section>


                <section className="shop-section">

                    <div className="menu-section-heading">

    <div className="section-heading">

        <span className="eyebrow">
            MENU MANAGEMENT
        </span>

        <h2>
            Your Menu
        </h2>

        <p>
            Manage categories and food items.
        </p>

    </div>

    <button
    className="add-category-button"
    onClick={() => {
        setCategoryError("");
        setCategoryName("");
        setShowCategoryForm(true);
    }}
>
    + Add Category
</button>

</div>


                    {loading ? (

                        <p className="status-text">
                            Loading menu...
                        </p>

                    ) : (

                        <>
                            <div className="shop-category-list">

    {categories.map(category => {

        const categoryItems = items.filter(
            item =>
                item.category_id ===
                category.category_id
        );

        return (
            <div
                key={category.category_id}
                className="shop-category-card"
            >

                <div
                    className="shop-category-header"
                    onClick={() =>
                        setExpandedCategory(
                            expandedCategory ===
                                category.category_id
                                ? null
                                : category.category_id
                        )
                    }
                >

                    <div className="category-title">
                        <h3>
                            {category.category_name}
                        </h3>

                        <span className="item-count">
                            {categoryItems.length} items
                        </span>
                    </div>


                    <button
    className="category-edit-button"
    onClick={(event) => {
        event.stopPropagation();

        setCategoryError("");
        setCategoryName(category.category_name);
        setEditingCategory(category);
    }}
>
    Edit
</button>

                </div>


                {expandedCategory ===
                    category.category_id && (

                    <div
                        className="category-items"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {categoryItems.length === 0 ? (

                            <div className="category-empty">
                                <p>
                                    No items in this category yet.
                                </p>
                            </div>

                        ) : (

                            categoryItems.map(item => (

                                <div
                                    key={item.item_id}
                                    className="shop-item-card"
                                >

                                    <div className="shop-item-info">

                                        <h4>
                                            {item.name}
                                        </h4>

                                        <p>
                                            {item.description ||
                                                "No description"}
                                        </p>

                                    </div>


                                    <div className="shop-item-actions">

                                        <strong>
                                            ₹{Number(
                                                item.price
                                            ).toFixed(2)}
                                        </strong>

                                        <span
                                            className={
                                                item.is_available
                                                    ? "item-status available"
                                                    : "item-status unavailable"
                                            }
                                        >
                                            {item.is_available
                                                ? "Available"
                                                : "Unavailable"}
                                        </span>

                                        <button
                                            className="item-edit-button"
                                            onClick={() =>
                                                console.log(
                                                    "Edit item",
                                                    item.item_id
                                                )
                                            }
                                        >
                                            Edit
                                        </button>

                                    </div>

                                </div>

                            ))

                        )}


                        <button
    className="add-item-button"
    onClick={() => {
        setSelectedCategory(category);

        setItemForm({
            name: "",
            description: "",
            price: ""
        });

        setItemError("");
        setShowItemForm(true);
    }}
>
    + Add Item
</button>

                    </div>

                )}

            </div>
        );
    })}

</div>
                        </>

                    )}

                </section>


                <section className="shop-section">

                    <div className="section-heading">

                        <span className="eyebrow">
                            ORDERS
                        </span>

                        <h2>
                            Incoming Orders
                        </h2>

                        <p>
                            Orders placed at your shop.
                        </p>

                    </div>


                    {loading ? (

                        <p className="status-text">
                            Loading orders...
                        </p>

                    ) : (

                        <div className="shop-order-list">

                            {orders.length === 0 ? (

                                <div className="empty-state">

                                    <h3>
                                        No orders yet
                                    </h3>

                                    <p>
                                        New customer orders
                                        will appear here.
                                    </p>

                                </div>

                            ) : (

                                orders.map(order => (

                                    <article
                                        key={order.order_id}
                                        className="shop-order-card"
                                    >

                                        <div>

                                            <span className="eyebrow">
                                                ORDER #{order.order_id}
                                            </span>

                                            <h3>
                                                {formatStatus(
                                                    order.status
                                                )}
                                            </h3>

                                        </div>


                                        <strong>
                                            ₹{Number(
                                                order.total_amount
                                            ).toFixed(2)}
                                        </strong>

                                    </article>

                                ))

                            )}

                        </div>

                    )}

                </section>

            </main>
{showCategoryForm && (
    <div
        className="shop-modal-overlay"
        onClick={() => {
            if (!categoryLoading) {
                setShowCategoryForm(false);
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
                        MENU
                    </span>

                    <h2>
                        Add Category
                    </h2>
                </div>

                <button
                    className="shop-modal-close"
                    onClick={() =>
                        setShowCategoryForm(false)
                    }
                    disabled={categoryLoading}
                >
                    ×
                </button>

            </div>


            <form onSubmit={addCategory}>

                <div className="form-group">

                    <label htmlFor="category_name">
                        Category Name
                    </label>

                    <input
                        id="category_name"
                        type="text"
                        placeholder="e.g. Main Course"
                        value={categoryName}
                        onChange={(event) =>
                            setCategoryName(
                                event.target.value
                            )
                        }
                        required
                    />

                </div>


                {categoryError && (
                    <p className="error-text">
                        {categoryError}
                    </p>
                )}


                <div className="shop-modal-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setShowCategoryForm(false)
                        }
                        disabled={categoryLoading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={categoryLoading}
                    >
                        {categoryLoading
                            ? "Adding..."
                            : "Add Category"}
                    </button>

                </div>

            </form>

        </div>
    </div>
)}

{editingCategory && (
    <div
        className="shop-modal-overlay"
        onClick={() => {
            if (!categoryLoading) {
                setEditingCategory(null);
                setCategoryError("");
            }
        }}
    >
        <div
            className="shop-modal category-edit-modal"
            onClick={(event) =>
                event.stopPropagation()
            }
        >
            <div className="shop-modal-header">

                <div>
                    <span className="eyebrow">
                        CATEGORY
                    </span>

                    <h2>
                        Edit Category
                    </h2>
                </div>

                <button
                    className="shop-modal-close"
                    onClick={() =>
                        setEditingCategory(null)
                    }
                    disabled={categoryLoading}
                >
                    ×
                </button>

            </div>

            <form onSubmit={updateCategory}>

                <div className="form-group">

                    <label htmlFor="edit_category_name">
                        Category Name
                    </label>

                    <input
                        id="edit_category_name"
                        type="text"
                        value={categoryName}
                        onChange={(event) =>
                            setCategoryName(
                                event.target.value
                            )
                        }
                        required
                    />

                </div>

                {categoryError && (
                    <p className="error-text">
                        {categoryError}
                    </p>
                )}

                <div className="shop-modal-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                            setEditingCategory(null)
                        }
                        disabled={categoryLoading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={categoryLoading}
                    >
                        {categoryLoading
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>


            <div className="category-danger-zone">

                <span className="danger-label">
                    DANGER ZONE
                </span>

                <p>
                    Deleting this category may fail if
                    it still contains menu items.
                </p>

                <button
                    className="category-delete-button"
                    onClick={() => {
                        setCategoryError("");
                        setDeleteCategory(
                            editingCategory
                        );
                    }}
                    disabled={categoryLoading}
                >
                    Delete Category
                </button>

            </div>

        </div>
    </div>
)}

{deleteCategory && (
    <div
        className="shop-modal-overlay"
        onClick={() => {
            if (!categoryLoading) {
                setDeleteCategory(null);
            }
        }}
    >
        <div
            className="shop-confirm-modal"
            onClick={(event) =>
                event.stopPropagation()
            }
        >

            <div className="confirm-icon">
                !
            </div>

            <span className="eyebrow">
                DELETE CATEGORY
            </span>

            <h2>
                Delete "{deleteCategory.category_name}"?
            </h2>

            <p>
                This action cannot be undone. If this
                category contains menu items, deletion
                may be rejected by the server.
            </p>

            {categoryError && (
                <p className="error-text">
                    {categoryError}
                </p>
            )}

            <div className="shop-modal-actions">

                <button
                    className="secondary-button"
                    onClick={() =>
                        setDeleteCategory(null)
                    }
                    disabled={categoryLoading}
                >
                    Cancel
                </button>

                <button
                    className="category-delete-confirm"
                    onClick={confirmDeleteCategory}
                    disabled={categoryLoading}
                >
                    {categoryLoading
                        ? "Deleting..."
                        : "Yes, Delete"}
                </button>

            </div>

        </div>
    </div>
)}

    {showItemForm && selectedCategory && (
    <div
        className="shop-modal-overlay"
        onClick={() => {
            if (!itemLoading) {
                setShowItemForm(false);
                setSelectedCategory(null);
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
                        ADD MENU ITEM
                    </span>

                    <h2>
                        Add Item
                    </h2>
                </div>

                <button
                    className="shop-modal-close"
                    onClick={() => {
                        setShowItemForm(false);
                        setSelectedCategory(null);
                    }}
                    disabled={itemLoading}
                >
                    ×
                </button>

            </div>


            <div className="selected-category-display">
                <span>
                    Category
                </span>

                <strong>
                    {selectedCategory.category_name}
                </strong>
            </div>


            <form onSubmit={addItem}>

                <div className="form-group">

                    <label htmlFor="item_name">
                        Item Name
                    </label>

                    <input
                        id="item_name"
                        type="text"
                        placeholder="Item name."
                        value={itemForm.name}
                        onChange={(event) =>
                            setItemForm({
                                ...itemForm,
                                name: event.target.value
                            })
                        }
                        required
                    />

                </div>


                <div className="form-group">

                    <label htmlFor="item_description">
                        Description
                    </label>

                    <textarea
                        id="item_description"
                        placeholder="Describe the item..."
                        rows="4"
                        value={itemForm.description}
                        onChange={(event) =>
                            setItemForm({
                                ...itemForm,
                                description:
                                    event.target.value
                            })
                        }
                    />

                </div>


                <div className="form-group">

                    <label htmlFor="item_price">
                        Price
                    </label>

                    <input
                        id="item_price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Enter price"
                        value={itemForm.price}
                        onChange={(event) =>
                            setItemForm({
                                ...itemForm,
                                price: event.target.value
                            })
                        }
                        required
                    />

                </div>


                {itemError && (
                    <p className="error-text">
                        {itemError}
                    </p>
                )}


                <div className="shop-modal-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            setShowItemForm(false);
                            setSelectedCategory(null);
                        }}
                        disabled={itemLoading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={itemLoading}
                    >
                        {itemLoading
                            ? "Adding..."
                            : "Add Item"}
                    </button>

                </div>

            </form>

        </div>
    </div>
)}

        </div>
    );
}

function formatStatus(status) {

    return status
        .replace("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


export default ShopDashboard;