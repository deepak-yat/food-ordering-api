async function loadShops() {
    const grid = document.getElementById("shops-grid");
    const loading = document.getElementById("shops-loading");

    try {
        const response = await fetch("/customer/view-shop");

        if (!response.ok) {
            throw new Error("Failed to load shops");
        }

        const shops = await response.json();

        loading.style.display = "none";

        if (shops.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No shops available</h3>
                    <p>
                        We're currently waiting for more shops
                        to join the platform.
                    </p>
                </div>
            `;
            return;
        }

        shops.forEach((shop, index) => {
            const card = document.createElement("article");

            card.className = "shop-card";
            card.style.animationDelay = `${index * 80}ms`;

            card.innerHTML = `
                <div class="shop-card-top">
                    <div class="shop-icon">
                        ${shop.shop_name.charAt(0).toUpperCase()}
                    </div>

                    <span class="shop-status">
                        Open
                    </span>
                </div>

                <h3>${escapeHtml(shop.shop_name)}</h3>

                <p class="shop-description">
                    ${escapeHtml(
                        shop.description ||
                        "Discover delicious food from this shop."
                    )}
                </p>

                <div
                    id="menu-${shop.shop_id}"
                    class="shop-menu-preview"
                >
                    <p class="menu-loading">
                        Loading menu...
                    </p>
                </div>

                <div class="shop-card-footer">
                    <a
                        href="/login?next=/customer/shops/${shop.shop_id}/menu"
                        class="btn btn-yellow"
                    >
                        View Menu
                    </a>
                </div>
            `;

            grid.appendChild(card);

            loadShopMenu(shop.shop_id);
        });

    } catch (error) {
        loading.style.display = "none";

        grid.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load shops</h3>
                <p>Please try again later.</p>
            </div>
        `;

        console.error(error);
    }
}


async function loadShopMenu(shopId) {
    const container = document.getElementById(
        `menu-${shopId}`
    );

    try {
        const response = await fetch(`/customer/view-shop/${shopId}/menu`)

        if (!response.ok) {
            throw new Error("Failed to load menu");
        }

        const categories = await response.json();

        const items = [];

        for (const category of categories) {
            for (const item of category.items) {

                if (items.length >= 3) {
                    break;
                }

                items.push(item);
            }

            if (items.length >= 3) {
                break;
            }
        }

        if (items.length === 0) {
            container.innerHTML = `
                <p class="menu-loading">
                    Menu not available yet.
                </p>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="menu-preview-item">
                <span>${escapeHtml(item.name)}</span>

                <strong>
                    ₹${Number(item.price).toFixed(2)}
                </strong>
            </div>
        `).join("");

    } catch (error) {
        container.innerHTML = `
            <p class="menu-loading">
                Menu unavailable.
            </p>
        `;

        console.error(error);
    }
}


function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}


loadShops();