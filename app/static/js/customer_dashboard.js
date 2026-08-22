async function loadShops() {

    const container =
        document.getElementById("dashboard-shops");

    try {

        const response = await fetch(
            "/customer/view-shop"
        );

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load shops");
        }

        const shops = await response.json();

        document.getElementById(
            "shop-count"
        ).textContent = shops.length;

        if (shops.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No shops available</h3>
                    <p>
                        There are currently no active shops.
                    </p>
                </div>
            `;

            return;
        }

        shops.forEach(shop => {

            const card =
                document.createElement("article");

            card.className = "shop-card";

            card.innerHTML = `
                <div class="shop-card-top">

                    <div class="shop-icon">
                        ${escapeHtml(
                            shop.shop_name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <span class="shop-status">
                        Open
                    </span>

                </div>

                <h3>
                    ${escapeHtml(shop.shop_name)}
                </h3>

                <p class="shop-description">
                    ${escapeHtml(
                        shop.description ||
                        "Great food awaits."
                    )}
                </p>

                <div class="shop-card-footer">

                    <button
                        class="btn btn-yellow"
                        onclick="viewShopMenu(
                            ${shop.shop_id},
                            '${escapeHtml(
                                shop.shop_name
                            )}'
                        )"
                    >
                        View Menu
                    </button>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load shops</h3>
                <p>
                    Please try again later.
                </p>
            </div>
        `;
    }
}

async function viewShopMenu(shopId, shopName) {

    try {

        const response = await fetch(
            `/customer/view-shop/${shopId}/menu`
        );

        if (!response.ok) {
            throw new Error("Unable to load menu");
        }

        const categories = await response.json();

        showMenuModal(
            shopId,
            shopName,
            categories
        );

    } catch (error) {

        console.error(error);

        alert("Unable to load this shop's menu.");
    }
}

function showMenuModal(
    shopId,
    shopName,
    categories
) {

    const existing =
        document.getElementById("menu-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.id = "menu-modal";
    modal.className = "menu-modal-overlay";

    let menuHTML = "";

    categories.forEach(category => {

        menuHTML += `
            <div class="menu-category">

                <h3>
                    ${escapeHtml(
                        category.category_name
                    )}
                </h3>
        `;

        category.items.forEach(item => {

            menuHTML += `
                <div class="dashboard-menu-item">

                    <div>
                        <strong>
                            ${escapeHtml(item.name)}
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.description || ""
                            )}
                        </p>
                    </div>

                    <div class="menu-item-side">

                        <span class="price">
                            ₹${Number(
                                item.price
                            ).toFixed(2)}
                        </span>

                        <button
                            class="btn btn-yellow"
                            onclick="addToCart(
                                ${item.item_id}
                            )"
                        >
                            Add
                        </button>

                    </div>

                </div>
            `;
        });

        menuHTML += `</div>`;
    });

    modal.innerHTML = `
        <div class="menu-modal">

            <div class="menu-modal-header">

                <div>
                    <span class="eyebrow">
                        MENU
                    </span>

                    <h2>
                        ${escapeHtml(shopName)}
                    </h2>
                </div>

                <button
                    class="modal-close"
                    onclick="closeMenuModal()"
                >
                    ×
                </button>

            </div>

            <div class="menu-modal-body">
                ${menuHTML}
            </div>

        </div>
    `;

    document.body.appendChild(modal);
}

function closeMenuModal() {

    const modal =
        document.getElementById("menu-modal");

    if (modal) {
        modal.remove();
    }
}

async function addToCart(itemId) {

    try {

        const response = await fetch(
            "/customer/cart/items",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    menu_item_id: itemId,
                    quantity: 1
                })
            }
        );

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            alert(
                data.detail ||
                "Unable to add item to cart."
            );

            return;
        }

        alert("Item added to cart.");

        loadCart();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );
    }
}

async function loadCart() {

    const container =
        document.getElementById(
            "cart-container"
        );

    try {

        const response = await fetch(
            "/customer/cart"
        );

        if (response.status === 404) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>
                        Browse a shop and add something
                        delicious.
                    </p>
                </div>
            `;

            document.getElementById(
                "cart-count"
            ).textContent = "0";

            return;
        }

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        const cart = await response.json();

        document.getElementById(
            "cart-count"
        ).textContent = cart.items.length;

        container.innerHTML = `
            <div class="cart-header-row">
                <span>Item</span>
                <span>Total</span>
            </div>

            ${cart.items.map(item => `
                <div class="cart-row">

                    <div>
                        <strong>
                            ${escapeHtml(item.name)}
                        </strong>

                        <p>
                            ${item.quantity}
                            × ₹${Number(
                                item.unit_price
                            ).toFixed(2)}
                        </p>
                    </div>

                    <strong class="price">
                        ₹${Number(
                            item.subtotal
                        ).toFixed(2)}
                    </strong>

                </div>
            `).join("")}

            <div class="cart-total">
                <span>Total</span>

                <strong>
                    ₹${Number(
                        cart.total
                    ).toFixed(2)}
                </strong>
            </div>

            <button
                class="btn btn-yellow checkout-button"
                onclick="checkout(${cart.cart_id})"
            >
                Place Order
            </button>
        `;

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p class="shop-description">
                Unable to load cart.
            </p>
        `;
    }
}

async function checkout(cartId) {

    const response = await fetch(
        "/customer/orders",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                cart_id: cartId
            })
        }
    );

    if (response.status === 401) {
        window.location.href = "/login";
        return;
    }

    const data = await response.json();

    if (!response.ok) {
        alert(
            data.detail ||
            "Unable to place order."
        );

        return;
    }

    alert(
        `Order #${data.order_id} placed successfully.`
    );

    loadCart();
    loadOrders();
}


async function loadOrders() {

    const container =
        document.getElementById(
            "orders-container"
        );

    /*
     * We'll connect this to the customer order-history
     * endpoint after we add that endpoint.
     */

    container.innerHTML = `
        <div class="empty-state">
            <h3>Orders</h3>
            <p>
                Your order history will appear here.
            </p>
        </div>
    `;
}

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadShops();
        loadCart();
        loadOrders();

        document
            .getElementById("logout-btn")
            .addEventListener(
                "click",
                logout
            );
    }
);

async function logout() {

    await fetch(
        "/auth/logout",
        {
            method: "POST"
        }
    );

    window.location.href = "/";
}