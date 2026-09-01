async function loadShopOrders() {

    const container =
        document.getElementById(
            "shop-orders-container"
        );

    try {

        const response = await fetch(
            "/shop/orders",
            {
                credentials: "include"
            }
        );

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (response.status === 403) {
            window.location.href = "/";
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Unable to load shop orders"
            );
        }

        const orders = await response.json();

        updateOrderStats(orders);

        if (orders.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No orders yet</h3>

                    <p>
                        New customer orders will appear here.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = orders.map(
            order => renderShopOrder(order)
        ).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load orders</h3>
                <p>
                    Please try again later.
                </p>
            </div>
        `;
    }
}

function updateOrderStats(orders) {

    const pending =
        orders.filter(
            order => order.status === "pending"
        ).length;

    const active =
        orders.filter(
            order =>
                order.status === "accepted" ||
                order.status === "preparing" ||
                order.status === "ready"
        ).length;

    document.getElementById(
        "pending-order-count"
    ).textContent = pending;

    document.getElementById(
        "active-order-count"
    ).textContent = active;

    document.getElementById(
        "total-order-count"
    ).textContent = orders.length;
}

function renderShopOrder(order) {

    const canAccept =
        order.status === "pending";

    return `
        <article class="order-card">

            <div class="order-card-header">

                <div>

                    <span class="eyebrow">
                        ORDER #${order.order_id}
                    </span>

                    <h3>
                        ${formatOrderStatus(
                            order.status
                        )}
                    </h3>

                </div>

                <strong class="price">
                    ₹${Number(
                        order.total_amount
                    ).toFixed(2)}
                </strong>

            </div>


            <div class="order-items">

                ${order.items.map(item => `
                    <div class="order-item-row">

                        <span>
                            ${escapeHtml(
                                item.item_name
                            )}
                            × ${item.quantity}
                        </span>

                        <strong>
                            ₹${Number(
                                item.subtotal
                            ).toFixed(2)}
                        </strong>

                    </div>
                `).join("")}

            </div>


            <div class="shop-order-actions">

                ${
                    canAccept
                    ? `
                        <button
                            class="btn btn-yellow"
                            onclick="
                                acceptOrder(
                                    ${order.order_id}
                                )
                            "
                        >
                            Accept Order
                        </button>

                        <button
                            class="btn btn-danger"
                            onclick="
                                rejectOrder(
                                    ${order.order_id}
                                )
                            "
                        >
                            Reject
                        </button>
                    `
                    : `
                        ${renderNextStatusButton(order)}
                    `
                }

            </div>


            <div class="order-date">
                ${new Date(
                    order.created_at
                ).toLocaleString()}
            </div>

        </article>
    `;
}

async function acceptOrder(orderId) {

    try {

        const response = await fetch(
            `/shop/orders/${orderId}/accept`,
            {
                method: "PUT",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (response.status === 403) {
            alert(
                "You are not authorized to accept this order."
            );
            return;
        }

        if (!response.ok) {
            alert(
                data.detail ||
                "Unable to accept order."
            );
            return;
        }

        await loadShopOrders();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );
    }
}

async function logout() {

    await fetch(
        "/auth/logout",
        {
            method: "POST",
            credentials: "include"
        }
    );

    window.location.href = "/";
}

function formatOrderStatus(status) {

    return status
        .replace("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
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

        loadShopOrders();

        document
            .getElementById("logout-btn")
            .addEventListener(
                "click",
                logout
            );
    }
);