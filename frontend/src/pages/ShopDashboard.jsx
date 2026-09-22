import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import OptionGroupCard from "../components/OptionGroupCard";
import OptionGroupModal from "../components/OptionGroupModal";
import OptionModal from "../components/OptionModal";

function ShopDashboard() {

    const navigate = useNavigate();
    const { logout } = useAuth();

    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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
    const [itemImage, setItemImage] = useState(null);
    const [itemImagePreview, setItemImagePreview] = useState("");
    const [itemForm, setItemForm] = useState({
        name: "",
        description: "",
        price: "",
        has_options: false,
        allow_parent_purchase: true
    });

    const [itemLoading, setItemLoading] = useState(false);
    const [itemError, setItemError] = useState("");


    const [showItemEditForm, setShowItemEditForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemOptionGroups, setItemOptionGroups] = useState([]);
    const [optionGroupsLoading, setOptionGroupsLoading] = useState(false);
    const [optionGroupsError, setOptionGroupsError] = useState("");
    const [showOptionGroupForm, setShowOptionGroupForm] = useState(false);

    const [optionGroupForm, setOptionGroupForm] = useState({
        name: "",
        selection_type: "SINGLE",
        price_mode: "ADD",
        required: false,
        min_selection: 0,
        max_selection: 1,
        display_order: 0
    });
    const [showOptionForm, setShowOptionForm] = useState(false);

const [selectedOptionGroup, setSelectedOptionGroup] = useState(null);

const [optionForm, setOptionForm] = useState({
    name: "",
    price: "",
    is_available: true,
    display_order: 0
});

const [optionSaving, setOptionSaving] = useState(false);

    const [optionGroupSaving, setOptionGroupSaving] = useState(false);
    const [itemEditImage, setItemEditImage] = useState(null);
    const [itemEditImagePreview, setItemEditImagePreview] = useState("");
    const [itemImageUploading, setItemImageUploading] = useState(false);
    const [itemEditForm, setItemEditForm] = useState({
        name: "",
        description: "",
        price: "",
        is_available: true,
        has_options: false,
        allow_parent_purchase: true
    });
const [editingOptionGroup, setEditingOptionGroup] = useState(null);
const [optionGroupEditForm, setOptionGroupEditForm] = useState({
    name: "",
    selection_type: "SINGLE",
    price_mode: "ADD",
    required: false,
    min_selection: 0,
    max_selection: 1,
    display_order: 0
});
const [showOptionGroupEditForm, setShowOptionGroupEditForm] = useState(false);
const [optionGroupEditSaving, setOptionGroupEditSaving] = useState(false);



    const [editingOption, setEditingOption] = useState(null);

const [optionEditForm, setOptionEditForm] = useState({
    name: "",
    price: "",
    is_available: true,
    display_order: 0
});

const [showOptionEditForm, setShowOptionEditForm] = useState(false);

const [optionEditSaving, setOptionEditSaving] = useState(false);



    const [itemEditLoading, setItemEditLoading] = useState(false);
    const [itemEditError, setItemEditError] = useState("");

    const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);
    const [itemDeleteLoading, setItemDeleteLoading] = useState(false);

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    useEffect(() => {
        loadDashboard();
        loadUnreadMessages();
    }, []);

    useEffect(() => {
        return () => {
            if (itemImagePreview) {
                URL.revokeObjectURL(itemImagePreview);
            }
        };
    }, [itemImagePreview]);

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

    async function loadCategories() {
        const data = await apiFetch("/menu/categories");
        setCategories(data);
    }

    async function handleLogout() {

        try {
            await logout();
        } finally {
            navigate("/login");
        }
    }

    async function loadItemOptionGroups(itemId) {
        try {
            setOptionGroupsLoading(true);
            setOptionGroupsError("");

            const data = await apiFetch(
                `/shop/menu-items/${itemId}/options`
            );

            setItemOptionGroups(data || []);
        } catch (error) {
            console.error("Unable to load option groups:", error);

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/");
                return;
            }

            setOptionGroupsError(
                error.message ||
                "Unable to load item options."
            );
        } finally {
            setOptionGroupsLoading(false);
        }
    }

    async function createOptionGroup() {
    if (!selectedItem) {
        return;
    }

    const groupName = optionGroupForm.name.trim();

    if (!groupName) {
        setOptionGroupsError("Group name is required.");
        return;
    }

    const minSelection = Number(
        optionGroupForm.min_selection
    );

    const maxSelection =
        optionGroupForm.max_selection === null ||
        optionGroupForm.max_selection === ""
            ? null
            : Number(optionGroupForm.max_selection);

    if (minSelection < 0) {
        setOptionGroupsError(
            "Minimum selections cannot be negative."
        );
        return;
    }

    if (
        maxSelection !== null &&
        maxSelection < 0
    ) {
        setOptionGroupsError(
            "Maximum selections cannot be negative."
        );
        return;
    }

    if (
        maxSelection !== null &&
        minSelection > maxSelection
    ) {
        setOptionGroupsError(
            "Minimum selections cannot be greater than maximum selections."
        );
        return;
    }

    setOptionGroupSaving(true);
    setOptionGroupsError("");

    try {
        const newGroup = await apiFetch(
            `/shop/menu-items/${selectedItem.item_id}/option-groups`,
            {
                method: "POST",
                body: JSON.stringify({
                    name: groupName,
                    selection_type:
                        optionGroupForm.selection_type,
                    price_mode:
                        optionGroupForm.price_mode,
                    required:
                        optionGroupForm.required,
                    min_selection: minSelection,
                    max_selection: maxSelection,
                    display_order:
                        Number(optionGroupForm.display_order)
                })
            }
        );

        setItemOptionGroups((previousGroups) => [
            ...previousGroups,
            newGroup
        ]);

        setShowOptionGroupForm(false);

        setOptionGroupForm({
            name: "",
            selection_type: "SINGLE",
            price_mode : "ADD",
            required: false,
            min_selection: 0,
            max_selection: 1,
            display_order:
                itemOptionGroups.length + 1
        });

    } catch (error) {
        console.error(
            "Unable to create option group:",
            error
        );

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setOptionGroupsError(
            error.data?.detail ||
            error.message ||
            "Unable to create option group."
        );

    } finally {
        setOptionGroupSaving(false);
    }
}



function handleOptionGroupEditChange(field, value) {
    setOptionGroupEditForm((previous) => ({
        ...previous,
        [field]: value
    }));
}



async function updateOptionGroup() {
    if (!editingOptionGroup) return;

    const groupName = optionGroupEditForm.name.trim();

    if (!groupName) {
        setOptionGroupsError("Option group name is required.");
        return;
    }

    if (
        optionGroupEditForm.min_selection < 0 ||
        optionGroupEditForm.max_selection < 0
    ) {
        setOptionGroupsError("Selection values cannot be negative.");
        return;
    }

    if (
        optionGroupEditForm.max_selection !== "" &&
        Number(optionGroupEditForm.max_selection) <
            Number(optionGroupEditForm.min_selection)
    ) {
        setOptionGroupsError(
            "Maximum selection cannot be less than minimum selection."
        );
        return;
    }

    setOptionGroupEditSaving(true);
    setOptionGroupsError("");

    try {
        const updatedGroup = await apiFetch(
            `/shop/menu-items/option-groups/${editingOptionGroup.group_id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    name: groupName,
                    selection_type: optionGroupEditForm.selection_type,
                    price_mode : optionGroupEditForm.price_mode,
                    required: optionGroupEditForm.required,
                    min_selection: Number(optionGroupEditForm.min_selection),
                    max_selection:
                        optionGroupEditForm.max_selection === ""
                            ? null
                            : Number(optionGroupEditForm.max_selection),
                    display_order: Number(optionGroupEditForm.display_order)
                })
            }
        );

        setItemOptionGroups((previousGroups) =>
            previousGroups.map((group) =>
                group.group_id === editingOptionGroup.group_id
                    ? {
                          ...group,
                          ...updatedGroup
                      }
                    : group
            )
        );

        setShowOptionGroupEditForm(false);
        setEditingOptionGroup(null);

        setOptionGroupEditForm({
            name: "",
            selection_type: "SINGLE",
            price_mode: "ADD",
            required: false,
            min_selection: 0,
            max_selection: 1,
            display_order: 0
        });
    } catch (error) {
        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setOptionGroupsError(
            error.data?.detail ||
            error.message ||
            "Failed to update option group."
        );
    } finally {
        setOptionGroupEditSaving(false);
    }
}

function handleOptionEditChange(field, value) {
    setOptionEditForm((previous) => ({
        ...previous,
        [field]: value
    }));
}



    async function createOption() {
    if (!selectedOptionGroup) {
        return;
    }

    const optionName = optionForm.name.trim();

    if (!optionName) {
        setOptionGroupsError("Option name is required.");
        return;
    }

    if (
        optionForm.price === "" ||
        Number(optionForm.price) < 0
    ) {
        setOptionGroupsError(
            "Option price must be 0 or greater."
        );
        return;
    }

    setOptionSaving(true);
    setOptionGroupsError("");

    try {
        const newOption = await apiFetch(
            `/shop/menu-items/option-groups/${selectedOptionGroup.group_id}/options`,
            {
                method: "POST",
                body: JSON.stringify({
                    name: optionName,
                    price: Number(optionForm.price),
                    is_available: optionForm.is_available,
                    display_order: Number(
                        optionForm.display_order
                    )
                })
            }
        );

        setItemOptionGroups((previousGroups) =>
            previousGroups.map((group) =>
                group.group_id ===
                selectedOptionGroup.group_id
                    ? {
                          ...group,
                          options: [
                              ...(group.options || []),
                              newOption
                          ]
                      }
                    : group
            )
        );

        setShowOptionForm(false);
        setSelectedOptionGroup(null);

        setOptionForm({
            name: "",
            price: "",
            is_available: true,
            display_order: 0
        });

    } catch (error) {
        console.error(
            "Unable to create option:",
            error
        );

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setOptionGroupsError(
            error.data?.detail ||
            error.message ||
            "Unable to create option."
        );

    } finally {
        setOptionSaving(false);
    }
}
    

async function updateOption() {
    if (!editingOption || !selectedOptionGroup) {
        return;
    }

    const optionName = optionEditForm.name.trim();

    if (!optionName) {
        setOptionGroupsError(
            "Option name is required."
        );
        return;
    }

    if (
        optionEditForm.price === "" ||
        Number(optionEditForm.price) < 0
    ) {
        setOptionGroupsError(
            "Option price must be 0 or greater."
        );
        return;
    }

    setOptionEditSaving(true);
    setOptionGroupsError("");

    try {
        const updatedOption = await apiFetch(
            `/shop/menu-items/option-groups/${selectedOptionGroup.group_id}/options/${editingOption.option_id}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    name: optionName,
                    price: Number(optionEditForm.price),
                    is_available:
                        optionEditForm.is_available,
                    display_order: Number(
                        optionEditForm.display_order
                    )
                })
            }
        );

        setItemOptionGroups((previousGroups) =>
            previousGroups.map((group) =>
                group.group_id ===
                selectedOptionGroup.group_id
                    ? {
                        ...group,
                        options: (
                            group.options || []
                        ).map((option) =>
                            option.option_id ===
                            editingOption.option_id
                                ? updatedOption
                                : option
                        )
                    }
                    : group
            )
        );

        setShowOptionEditForm(false);
        setEditingOption(null);
        setSelectedOptionGroup(null);

        setOptionEditForm({
            name: "",
            price: "",
            is_available: true,
            display_order: 0
        });

    } catch (error) {

        console.error(
            "Unable to update option:",
            error
        );

        if (error.status === 401) {
            navigate("/login");
            return;
        }

        if (error.status === 403) {
            navigate("/");
            return;
        }

        setOptionGroupsError(
            error.data?.detail ||
            error.message ||
            "Unable to update option."
        );

    } finally {
        setOptionEditSaving(false);
    }
}



    async function addCategory(event) {
        event.preventDefault();

        setCategoryError("");

        if (!categoryName.trim()) {
            setCategoryError("Category name is required.");
            return;
        }

        try {
            setCategoryLoading(true);

            const newCategory = await apiFetch(
                "/menu/categories",
                {
                    method: "POST",
                    body: JSON.stringify(
                        {
                            category_name: categoryName.trim()
                        }
                    )
                }
            );
            console.log("Category created:", newCategory);

            await loadCategories();

            setCategoryName("");
            setShowCategoryForm(false);
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
            navigate("/shop/dashboard");
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
            setEditingCategory(null)
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

    function validateImage(file) {
        if (!file) {
            return "Please select an image.";
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            return "Only JPG, PNG and WEBP images are allowed.";
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            return "Image must be smaller than 5 MB.";
        }

        return "";
    }


    function handleItemImageChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const validationError = validateImage(file);

        if (validationError) {
            setItemError(validationError);
            return;
        }

        setItemError("");
        setItemImage(file);

        const previewUrl = URL.createObjectURL(file);
        setItemImagePreview(previewUrl);
    }

    function handleItemEditImageChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const validationError = validateImage(file);

        if (validationError) {
            setItemEditError(validationError);
            return;
        }

        setItemEditError("");
        setItemEditImage(file);

        const previewUrl = URL.createObjectURL(file);
        setItemEditImagePreview(previewUrl);
    }

    async function uploadMenuItemImage(itemId, file) {
        const formData = new FormData();

        formData.append("image", file);

        return await apiFetch(
            `/menu/categories/item/${itemId}/image`,
            {
                method: "POST",
                body: formData
            }
        );
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
                        category_id: selectedCategory.category_id,
                        name: itemForm.name.trim(),
                        description:
                            itemForm.description.trim() || null,
                        price: Number(itemForm.price),
                        has_options: itemForm.has_options,
                        allow_parent_purchase: itemForm.allow_parent_purchase
                    })
                }
            );

            let finalItem = newItem;

            if (itemImage) {
                setItemImageUploading(true);

                try {
                    finalItem = await uploadMenuItemImage(
                        newItem.item_id,
                        itemImage
                    );
                } catch (uploadError) {
                    try {
                        await apiFetch(
                            `/menu/categories/item/items/${newItem.item_id}`,
                            {
                                method: "DELETE"
                            }
                        );
                    } catch (rollbackError) {
                        console.error(
                            "Failed to rollback menu item:",
                            rollbackError
                        );
                    }

                    throw uploadError;

                } finally {
                    setItemImageUploading(false);
                }
            }

            setItems(currentItems => [
                ...currentItems,
                finalItem
            ]);

            setItemImage(null);
            setItemImagePreview("");
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

    async function loadUnreadMessages() {
        try {
            const data = await apiFetch(
                "/shop/messages"
            );

            const messages = data.messages || [];

            const unreadCount = messages.filter(
                message => !message.is_read
            ).length;

            setUnreadMessageCount(unreadCount);

        } catch (error) {
            console.error(
                "Unable to load unread messages:",
                error
            );
        }
    }
    async function openEditItem(item) {
        setSelectedItem(item);

        setItemEditForm({
            name: item.name || "",
            description: item.description || "",
            price: item.price ?? "",
            is_available: item.is_available ?? true,
            has_options: item.has_options ?? false,
            allow_parent_purchase: item.allow_parent_purchase ?? true
        });

        setItemEditImage(null);
        setItemEditError("");

        // Reset previous item's option state first
        setItemOptionGroups([]);
        setOptionGroupsError("");
        setShowOptionGroupForm(false);

        if (item.image_url) {
            setItemEditImagePreview(
                `http://127.0.0.1:8000${item.image_url}`
            );
        } else {
            setItemEditImagePreview("");
        }

        setShowItemEditForm(true);

        // Load configuration only for configurable items
        if (item.has_options) {
            await loadItemOptionGroups(item.item_id);
        }
    }
    function handleItemEditChange(event) {
        const { name, value, type, checked } = event.target;

        setItemEditForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function saveItemChanges() {
        if (!selectedItem) {
            return;
        }

        setItemEditLoading(true);
        setItemEditError("");

        try {
            const changes = {};

            if (itemEditForm.name !== selectedItem.name) {
                changes.name = itemEditForm.name.trim();
            }

            if (
                itemEditForm.description !==
                (selectedItem.description || "")
            ) {
                changes.description =
                    itemEditForm.description.trim();
            }

            if (
                Number(itemEditForm.price) !==
                Number(selectedItem.price)
            ) {
                changes.price = Number(itemEditForm.price);
            }

            if (
                itemEditForm.is_available !==
                selectedItem.is_available
            ) {
                changes.is_available =
                    itemEditForm.is_available;
            }
            if (
                itemEditForm.has_options !==
                selectedItem.has_options
            ) {
                changes.has_options = itemEditForm.has_options;
            }

            if (
                itemEditForm.allow_parent_purchase !==
                selectedItem.allow_parent_purchase
            ) {
                changes.allow_parent_purchase =
                    itemEditForm.allow_parent_purchase;
            }

            let updatedItem = selectedItem;

            // -----------------------------------------
            // Update normal item fields if changed
            // -----------------------------------------
            if (Object.keys(changes).length > 0) {
                updatedItem = await apiFetch(
                    `/menu/categories/item/${selectedItem.category_id}/${selectedItem.item_id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(changes)
                    }
                );
            }

            // -----------------------------------------
            // Add / replace image if selected
            // -----------------------------------------
            if (itemEditImage) {
                setItemImageUploading(true);

                try {
                    updatedItem = await uploadMenuItemImage(
                        selectedItem.item_id,
                        itemEditImage
                    );
                } finally {
                    setItemImageUploading(false);
                }
            }

            // -----------------------------------------
            // Nothing changed at all
            // -----------------------------------------
            if (
                Object.keys(changes).length === 0 &&
                !itemEditImage
            ) {
                setItemEditError("No changes were made.");
                return;
            }

            // -----------------------------------------
            // Update local item state
            // -----------------------------------------
            setItems((previousItems) =>
                previousItems.map((item) =>
                    item.item_id === updatedItem.item_id
                        ? updatedItem
                        : item
                )
            );

            setShowItemEditForm(false);
            setSelectedItem(null);
            setItemEditImage(null);
            setItemEditImagePreview("");

        } catch (error) {
            console.error(
                "Unable to edit menu item:",
                error
            );

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            if (error.status === 403) {
                navigate("/");
                return;
            }

            setItemEditError(
                error.data?.detail ||
                error.message ||
                "Unable to edit item."
            );

        } finally {
            setItemEditLoading(false);
            setItemImageUploading(false);
        }
    }

    async function deleteItem() {
        if (!selectedItem) return;

        setItemDeleteLoading(true);

        try {
            await apiFetch(`/menu/categories/item/items/${selectedItem.item_id}`, {
                method: "DELETE"
            });
            setEditingCategory(null);
            setItems((previousItems) =>
                previousItems.filter(
                    (item) => item.item_id !== selectedItem.item_id
                )
            );

            setShowDeleteItemConfirm(false);
            setShowItemEditForm(false);
            setSelectedItem(null);

        } catch (error) {
            setItemEditError(
                error.data?.detail ||
                error.message ||
                "Failed to delete item"
            );
        } finally {
            setItemDeleteLoading(false);
        }
    }
    const pendingOrders = orders.filter(
        (order) => order.status.toLowerCase() === "pending"
    );
    async function toggleItemAvailability(item) {
        try {
            const updatedItem = await apiFetch(
                `/menu/categories/item/${item.category_id}/${item.item_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        is_available: !item.is_available
                    })
                }
            );

            setItems((previousItems) =>
                previousItems.map((currentItem) =>
                    currentItem.item_id === updatedItem.item_id
                        ? updatedItem
                        : currentItem
                )
            );

        } catch (error) {
            console.error("Failed to update availability:", error);
        }
    }

    return (
        <div className="shop-dashboard">

            <header className="shop-navbar">

                <div className="shop-navbar-container">

                    <span to="" className="logo">
                        Foodly
                        <img
                            src="/logo1.png"
                            alt="Foodly"
                            className="logo-icon"
                        />
                    </span>




                    <nav className="shop-nav">

                        <button onClick={() => navigate("/shop/overview")}>
                            Overview
                        </button>

                        <button>
                            Menu
                        </button>
                        
                        <button
    onClick={() => navigate("/shop/offers")}
>
    Offers & Discounts
</button>


                        <button
                            onClick={() => navigate("/shop/orders")}
                        >
                            Orders
                        </button>

                        <button
                            className="shop-profile-nav-button"
                            onClick={() => navigate("/shop/profile")}
                        >
                            Profile
                        </button>

                        <button
                            className="shop-notification-button"
                            onClick={() => navigate("/shop/messages")}
                            aria-label="Messages"
                        >
                            <span className="shop-notification-icon">
                                🔔
                            </span>

                            {unreadMessageCount > 0 && (
                                <span className="shop-notification-badge">
                                    {unreadMessageCount > 99
                                        ? "99+"
                                        : unreadMessageCount}
                                </span>
                            )}
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

                                                                    <div className="shop-item-image">
                                                                        {item.image_url ? (
                                                                            <img
                                                                                src={`http://127.0.0.1:8000${item.image_url}`}
                                                                                alt={item.name}
                                                                            />
                                                                        ) : (
                                                                            <div className="shop-item-image-placeholder">
                                                                                No Image
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="shop-item-info">

                                                                        <h4>
                                                                            {item.name}
                                                                        </h4>

                                                                        <p>
                                                                            {item.description || "No description"}
                                                                        </p>

                                                                    </div>

                                                                    <div className="shop-item-actions">

                                                                        <strong>
                                                                            ₹{Number(item.price).toFixed(2)}
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
                                                                            onClick={() => openEditItem(item)}
                                                                        >
                                                                            Edit
                                                                        </button>

                                                                        <div className="item-availability">
                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    item.is_available
                                                                                        ? "availability-status available"
                                                                                        : "availability-status unavailable"
                                                                                }
                                                                                onClick={() =>
                                                                                    toggleItemAvailability(item)
                                                                                }
                                                                                title={
                                                                                    item.is_available
                                                                                        ? "Mark as unavailable"
                                                                                        : "Mark as available"
                                                                                }
                                                                            >
                                                                                <span className="availability-icon">
                                                                                    {item.is_available ? "✓" : "×"}
                                                                                </span>
                                                                            </button>
                                                                        </div>

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
                                                                    price: "",
                                                                    has_options: false,
                                                                    allow_parent_purchase: true
                                                                });
                                                                setItemImage(null);
                                                                setItemImagePreview("");
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

                    <div className="section-header">
                        <div>
                            <h2>Incoming Orders</h2>
                            <p>Manage your recent customer orders</p>
                        </div>

                        <span className="order-count">
                            {orders.length} Orders
                        </span>
                        <button
                            className="view-live-orders-btn"
                            onClick={() => navigate("/shop/orders")}
                        >
                            View Live Orders →
                        </button>

                    </div>

                    {orders.length === 0 ? (

                        <div className="empty-orders">
                            <div className="empty-orders-icon">
                                🧾
                            </div>

                            <h3>No orders yet</h3>

                            <p>
                                New customer orders will appear here.
                            </p>
                        </div>

                    ) : pendingOrders.length === 0 ? (

                        <div className="empty-orders">
                            <div className="empty-orders-icon">
                                🧾
                            </div>

                            <h3>No new orders</h3>

                            <p>
                                You're all caught up.
                            </p>
                        </div>

                    ) : (

                        <div className="orders-list">

                            {pendingOrders.map((order) => (

                                <div
                                    className="order-card"
                                    key={order.order_id}
                                >

                                    <div className="order-card-header">

                                        <div>
                                            <h3>
                                                Order #{order.order_id}
                                            </h3>
                                        </div>

                                        <span
                                            className={`order-status ${order.status}`}
                                        >
                                            {order.status}
                                        </span>

                                    </div>

                                    <div className="customer-details">

                                        <p>
                                            <strong>
                                                {order.customer_name}
                                            </strong>
                                        </p>

                                        <p>
                                            Phone:{" "}
                                            {order.customer_phone || "Not provided"}
                                        </p>

                                    </div>

                                    <div className="order-items">

                                        <h4>Items</h4>

                                        {order.items.map((item) => (

                                            <div
                                                className="order-item-row"
                                                key={item.order_item_id}
                                            >

                                                <div>
                                                    <span className="order-item-name">
                                                        {item.item_name}
                                                    </span>

                                                    <span className="order-item-quantity">
                                                        × {item.quantity}
                                                    </span>
                                                </div>

                                                <span>
                                                    ₹{item.subtotal}
                                                </span>

                                            </div>

                                        ))}

                                    </div>

                                    <div className="order-card-footer">

                                        <span>
                                            Total
                                        </span>

                                        <strong>
                                            ₹{order.total_amount}
                                        </strong>

                                    </div>

                                </div>

                            ))}

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

                        <div className="shop-modal-body">
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





                            <div className="form-group">

                                <label htmlFor="item_image">
                                    Food Image
                                </label>

                                <input
                                    id="item_image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleItemImageChange}
                                    disabled={itemLoading || itemImageUploading}
                                />

                                {itemImagePreview && (
                                    <div className="item-image-preview">
                                        <img
                                            src={itemImagePreview}
                                            alt="Food preview"
                                        />
                                    </div>
                                )}

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
                                    disabled={itemLoading || itemImageUploading}                                >
                                    {itemImageUploading
                                        ? "Uploading Image..."
                                        : itemLoading
                                            ? "Adding..."
                                            : "Add Item"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {showItemEditForm && selectedItem && (
                <div className="shop-modal-overlay">
                    <div className="shop-modal">

                        <div className="shop-modal-header">
                            <div>
                                <h2>Edit Item</h2>
                                <p>Update your menu item details</p>
                            </div>

                            <button
                                className="shop-modal-close"
                                onClick={() => {
                                    setShowItemEditForm(false);
                                    setSelectedItem(null);
                                    setItemEditImage(null);
                                    setItemEditImagePreview("");
                                    setItemEditError("");
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="shop-modal-body">

                            <div className="form-group">
                                <label>Item Name</label>

                                <input
                                    type="text"
                                    name="name"
                                    value={itemEditForm.name}
                                    onChange={handleItemEditChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>

                                <textarea
                                    name="description"
                                    value={itemEditForm.description}
                                    onChange={handleItemEditChange}
                                    rows="4"
                                />
                            </div>

                            <div className="form-group">
                                <label>Price</label>

                                <input
                                    type="number"
                                    name="price"
                                    value={itemEditForm.price}
                                    onChange={handleItemEditChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="option-toggle-row">
    <label className="option-toggle">
        <input
            type="checkbox"
            name="has_options"
            checked={itemEditForm.has_options}
            onChange={handleItemEditChange}
        />

        <span className="custom-checkbox"></span>

        <span className="option-toggle-text">
            This item has options
        </span>
    </label>
</div>

                            {itemEditForm.has_options && (
    <div className="option-toggle-row option-toggle-secondary">
        <label className="option-toggle">
            <input
                type="checkbox"
                name="allow_parent_purchase"
                checked={itemEditForm.allow_parent_purchase}
                onChange={handleItemEditChange}
            />

            <span className="custom-checkbox"></span>

            <span className="option-toggle-text">
                Allow direct purchase of parent item
            </span>
        </label>

        <p className="form-help-text">
            Customers can add the main item directly without
            selecting an option.
        </p>
    </div>
)}

                            <div className="form-group">

                                <label htmlFor="edit_item_image">
                                    Food Image
                                </label>

                                <input
                                    id="edit_item_image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleItemEditImageChange}
                                    disabled={
                                        itemEditLoading ||
                                        itemImageUploading
                                    }
                                />

                                {itemEditImagePreview && (
                                    <div className="item-image-preview">
                                        <img
                                            src={itemEditImagePreview}
                                            alt={selectedItem.name}
                                        />
                                    </div>
                                )}

                            </div>

                            {itemEditForm.has_options && (
                                <div className="option-configuration-section">

                                    <div className="option-section-header">
                                        <div>
                                            <h3>Option Configuration</h3>
                                            <p>
                                                Add choices and variations for this item.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => {
                                                setOptionGroupForm({
                                                    name: "",
                                                    selection_type: "SINGLE",
                                                    price_mode:"ADD",
                                                    required: false,
                                                    min_selection: 0,
                                                    max_selection: 1,
                                                    display_order: itemOptionGroups.length
                                                });

                                                setOptionGroupsError("");
                                                setShowOptionGroupForm(true);
                                            }}
                                        >
                                            + Add Option Group
                                        </button>
                                    </div>

                                    {optionGroupsLoading ? (
                                        <p className="status-text">
                                            Loading options...
                                        </p>
                                    ) : itemOptionGroups.length === 0 ? (
                                        <div className="option-empty-state">
                                            <p>No option groups added yet.</p>
                                            <span>
                                                Example: Portion, Size, Add-ons
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="option-groups-list">

    {itemOptionGroups.map((group) => (

        <OptionGroupCard
            key={group.group_id}
            group={group}

            onEditGroup={(group) => {
    setEditingOptionGroup(group);

    setOptionGroupEditForm({
        name: group.name || "",
        selection_type: group.selection_type || "SINGLE",
        price_mode: group.price_mode || "ADD",   
        required: group.required ?? false,
        min_selection: group.min_selection ?? 0,
        max_selection: group.max_selection ?? 1,
        display_order: group.display_order ?? 0
    });

    setOptionGroupsError("");
    setShowOptionGroupEditForm(true);
}}

            onAddOption={(group) => {

    setSelectedOptionGroup(group);

    setOptionForm({
        name: "",
        price: "",
        is_available: true,
        display_order:
            group.options?.length || 0
    });

    setOptionGroupsError("");

    setShowOptionForm(true);
}}

            onEditOption={(group, option) => {

    setSelectedOptionGroup(group);

    setEditingOption(option);

    setOptionEditForm({
        name: option.name || "",
        price: option.price ?? "",
        is_available:
            option.is_available ?? true,
        display_order:
            option.display_order ?? 0
    });

    setOptionGroupsError("");

    setShowOptionEditForm(true);
}}
        />

    ))}

</div>
                                    )}

                                    {optionGroupsError && (
                                        <p className="shop-form-error">
                                            {optionGroupsError}
                                        </p>
                                    )}

                                </div>
                            )}

                            {itemEditError && (
                                <p className="shop-form-error">
                                    {itemEditError}
                                </p>
                            )}

                            {/* Danger Zone */}
                            <div className="danger-zone">
                                <h3>Danger Zone</h3>

                                <p>
                                    Deleting this item will permanently remove it
                                    from your menu.
                                </p>

                                <button
                                    type="button"
                                    className="delete-item-btn"
                                    onClick={() => setShowDeleteItemConfirm(true)}
                                >
                                    Delete Item
                                </button>
                            </div>

                        </div>

                        <div className="shop-modal-actions">

                            <button
                                className="shop-cancel-btn"
                                onClick={() => setShowItemEditForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="shop-save-btn"
                                onClick={saveItemChanges}
                                disabled={
                                    itemEditLoading ||
                                    itemImageUploading
                                }
                            >
                                {itemImageUploading
                                    ? "Uploading Image..."
                                    : itemEditLoading
                                        ? "Saving..."
                                        : "Save Changes"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {showOptionGroupForm && selectedItem && (
    <div
        className="shop-modal-overlay"
        onClick={() => {
            if (!optionGroupSaving) {
                setShowOptionGroupForm(false);
                setOptionGroupsError("");
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
                        MENU OPTIONS
                    </span>

                    <h2>Add Option Group</h2>

                    <p>
                        Create a group of choices for{" "}
                        {selectedItem.name}.
                    </p>
                </div>

                <button
                    type="button"
                    className="shop-modal-close"
                    onClick={() => {
                        setShowOptionGroupForm(false);
                        setOptionGroupsError("");
                    }}
                    disabled={optionGroupSaving}
                >
                    ×
                </button>

            </div>

            <div className="shop-modal-body">

                <div className="form-group">
                    <label>Group Name</label>

                    <input
                        type="text"
                        placeholder="e.g. Portion, Size, Add-ons"
                        value={optionGroupForm.name}
                        onChange={(event) =>
                            setOptionGroupForm(
                                (previous) => ({
                                    ...previous,
                                    name: event.target.value
                                })
                            )
                        }
                        disabled={optionGroupSaving}
                    />
                </div>

                <div className="form-group">

    <label>Selection Type</label>

    <div className="shop-select-wrapper">

        <select
            className="shop-selection-type"
            value={optionGroupForm.selection_type}
            onChange={(event) => {
                const selectionType = event.target.value;

                setOptionGroupForm((previous) => ({
                    ...previous,
                    selection_type: selectionType,
                    min_selection:
                        selectionType === "SINGLE"
                            ? 1
                            : 0,
                    max_selection:
                        selectionType === "SINGLE"
                            ? 1
                            : null
                }));
            }}
            disabled={optionGroupSaving}
        >
            <option value="SINGLE">
                Single
            </option>

            <option value="MULTIPLE">
                Multiple
            </option>
        </select>

        <span className="shop-select-arrow">
            ▾
        </span>

    </div>

</div>


<div className="form-group">
    <label>Pricing Behavior</label>

    <select
        value={optionGroupForm.price_mode}
        onChange={(event) =>
            setOptionGroupForm((prev) => ({
                ...prev,
                price_mode: event.target.value
            }))
        }
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
                            checked={
                                optionGroupForm.required
                            }
                            onChange={(event) =>
                                setOptionGroupForm(
                                    (previous) => ({
                                        ...previous,
                                        required:
                                            event.target.checked
                                    })
                                )
                            }
                            disabled={optionGroupSaving}
                        />

                        <span className="custom-checkbox"></span>

                        <span className="option-toggle-text">
                            Required
                        </span>

                    </label>
                </div>

                <div className="option-selection-grid">

                    <div className="form-group">
                        <label>
                            Minimum Selections
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={
                                optionGroupForm.min_selection
                            }
                            onChange={(event) =>
                                setOptionGroupForm(
                                    (previous) => ({
                                        ...previous,
                                        min_selection:
                                            event.target.value
                                    })
                                )
                            }
                            disabled={
                                optionGroupSaving ||
                                optionGroupForm.selection_type ===
                                    "SINGLE"
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Maximum Selections
                        </label>

                        <input
                            type="number"
                            min="1"
                            placeholder="No limit"
                            value={
                                optionGroupForm.max_selection ??
                                ""
                            }
                            onChange={(event) =>
                                setOptionGroupForm(
                                    (previous) => ({
                                        ...previous,
                                        max_selection:
                                            event.target.value ===
                                            ""
                                                ? null
                                                : event.target.value
                                    })
                                )
                            }
                            disabled={
                                optionGroupSaving ||
                                optionGroupForm.selection_type ===
                                    "SINGLE"
                            }
                        />
                    </div>

                </div>

                {optionGroupsError && (
                    <p className="shop-form-error">
                        {optionGroupsError}
                    </p>
                )}

                <div className="shop-modal-actions">

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            setShowOptionGroupForm(false);
                            setOptionGroupsError("");
                        }}
                        disabled={optionGroupSaving}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={createOptionGroup}
                        disabled={optionGroupSaving}
                    >
                        {optionGroupSaving
                            ? "Adding..."
                            : "Add Group"}
                    </button>

                </div>

            </div>
        </div>
    </div>
)}




<OptionGroupModal
    show={showOptionGroupEditForm}
    group={editingOptionGroup}
    form={optionGroupEditForm}
    onChange={handleOptionGroupEditChange}
    onClose={() => {
        if (!optionGroupEditSaving) {
            setShowOptionGroupEditForm(false);
            setEditingOptionGroup(null);
            setOptionGroupsError("");
        }
    }}
    onSave={updateOptionGroup}
    saving={optionGroupEditSaving}
    error={optionGroupsError}
/>




<OptionModal
    show={showOptionForm}
    mode="add"
    group={selectedOptionGroup}
    option={null}
    form={optionForm}
    onChange={(field, value) => {
        setOptionForm((previous) => ({
            ...previous,
            [field]: value
        }));
    }}
    onClose={() => {
        if (!optionSaving) {
            setShowOptionForm(false);
            setSelectedOptionGroup(null);
            setOptionGroupsError("");
        }
    }}
    onSave={createOption}
    saving={optionSaving}
    error={optionGroupsError}
/>

<OptionModal
    show={showOptionEditForm}
    mode="edit"
    group={selectedOptionGroup}
    option={editingOption}
    form={optionEditForm}
    onChange={handleOptionEditChange}
    onClose={() => {
        if (!optionEditSaving) {
            setShowOptionEditForm(false);
            setEditingOption(null);
            setSelectedOptionGroup(null);
            setOptionGroupsError("");
        }
    }}
    onSave={updateOption}
    saving={optionEditSaving}
    error={optionGroupsError}
/>




            {showDeleteItemConfirm && selectedItem && (
                <div className="shop-modal-overlay">
                    <div className="delete-confirm-modal">

                        <div className="delete-confirm-icon">
                            !
                        </div>

                        <h2>Delete Item?</h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>{selectedItem.name}</strong>?
                        </p>

                        <p className="delete-warning">
                            This action cannot be undone.
                        </p>

                        <div className="delete-confirm-actions">

                            <button
                                className="shop-cancel-btn"
                                onClick={() => setShowDeleteItemConfirm(false)}
                                disabled={itemDeleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-delete-btn"
                                onClick={deleteItem}
                                disabled={itemDeleteLoading}
                            >
                                {itemDeleteLoading
                                    ? "Deleting..."
                                    : "Delete Item"}
                            </button>

                        </div>

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