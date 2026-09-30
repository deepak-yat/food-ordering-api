import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
} from "recharts";
function ShopOverview() {

    const navigate = useNavigate();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOverview();
    }, []);

    async function loadOverview() {

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/shop/overview",
                {
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail || "Failed to load shop overview"
                );
            }

            setOverview(data);

        } catch (error) {

            console.error(
                "Failed to load shop overview:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="shop-overview-page">
                <p className="shop-overview-status">
                    Loading overview...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="shop-overview-page">
                <p className="shop-overview-error">
                    {error}
                </p>
            </div>
        );
    }

    if (!overview) {
        return null;
    }

    return (
        <div className="shop-overview-page">

            {/* Header */}

            <div className="shop-overview-header">

                <button
                    type="button"
                    className="shop-overview-back-btn"
                    onClick={() =>
                        navigate("/shop/dashboard")
                    }
                >
                    ← Dashboard
                </button>

                <div>
                    <span className="eyebrow">
                        SHOP OVERVIEW
                    </span>

                    <h1>
                        Analytics
                    </h1>
                </div>

            </div>


            {/* Shop Details */}

            <section className="shop-overview-details">

                <div className="shop-overview-details-main">

                    <span className="eyebrow">
                        SHOP DETAILS
                    </span>

                    <h2>
                        {overview.shop.shop_name}
                    </h2>

                    {overview.shop.description && (
                        <p>
                            {overview.shop.description}
                        </p>
                    )}

                </div>


                <div className="shop-overview-details-status">

                    <span
                        className={
                            overview.shop.is_active
                                ? "shop-active-status"
                                : "shop-inactive-status"
                        }
                    >
                        ●{" "}
                        {overview.shop.is_active
                            ? "Active"
                            : "Inactive"}
                    </span>

                    <span className="shop-overview-id">
                        Shop ID: {overview.shop.shop_id}
                    </span>

                    <span className="shop-overview-phone">
                        {overview.shop.phone
                            ? overview.shop.phone
                            : "Phone not added"}
                    </span>

                </div>

            </section>


            {/* Summary */}

            <section className="shop-overview-summary">

                <div className="shop-overview-card">

                    <span>
                        TOTAL REVENUE
                    </span>

                    <strong>
                        ₹{overview.summary.total_revenue}
                    </strong>

                </div>


                <div className="shop-overview-card">

                    <span>
                        TOTAL ORDERS
                    </span>

                    <strong>
                        {overview.summary.total_orders}
                    </strong>

                </div>


                <div className="shop-overview-card">

                    <span>
                        AVERAGE ORDER
                    </span>

                    <strong>
                        ₹
                        {overview.summary.average_order_value.toFixed(2)}
                    </strong>

                </div>


                <div className="shop-overview-card">

                    <span>
                        TOP ITEM
                    </span>

                    <strong>
                        {overview.summary.top_item || "No data"}
                    </strong>

                </div>

            </section>


            {/* Charts will go here */}

            <section className="shop-overview-chart-grid">

                <div className="shop-overview-chart-card">
                    <span className="eyebrow">
                        REVENUE
                    </span>

                    <div className="shop-overview-chart">

    <ResponsiveContainer width="100%" height={280}>
        <LineChart
            data={overview.revenue_trend}
            margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 5,
            }}
        >
            <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
            />

            <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                        }
                    )
                }
            />

            <YAxis />

            <Tooltip
                formatter={(value) => [
                    `₹${value}`,
                    "Revenue",
                ]}
                labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }
                    )
                }
            />

            <Line
                type="monotone"
                dataKey="revenue"
                stroke="#facc15"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                    r: 5,
                }}
            />
        </LineChart>
    </ResponsiveContainer>

</div>
                </div>


                <div className="shop-overview-chart-card">
                    <span className="eyebrow">
                        ORDERS
                    </span>

                    <div className="shop-overview-chart">

    <ResponsiveContainer width="100%" height={280}>
        <BarChart
            data={overview.order_trend}
            margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 5,
            }}
        >
            <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
            />

            <XAxis
                dataKey="date"
                tickFormatter={(value) =>
                    new Date(value).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                        }
                    )
                }
            />

            <YAxis allowDecimals={false} />

            <Tooltip
                formatter={(value) => [
                    value,
                    "Orders",
                ]}
                labelFormatter={(value) =>
                    new Date(value).toLocaleDateString(
                        "en-IN",
                        {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        }
                    )
                }
            />

            <Bar
                dataKey="orders"
                fill="#facc15"
                radius={[5, 5, 0, 0]}
            />
        </BarChart>
    </ResponsiveContainer>

</div>
                </div>

            </section>


            {/* Item analytics */}

            <section className="shop-overview-analysis-card">

    <div className="shop-overview-section-header">
        <div>
            <span className="eyebrow">
                ITEM DEMAND
            </span>

            <h2>
                Most Ordered Items
            </h2>
        </div>

        <span className="shop-overview-section-note">
            Based on quantity sold
        </span>
    </div>

    <div className="shop-demand-list">

        {overview.item_demand
            .slice(0, 6)
            .map((item, index) => {

                const maxQuantity =
                    overview.item_demand[0]?.quantity || 1;

                const percentage =
                    (item.quantity / maxQuantity) * 100;

                return (
                    <div
                        key={item.item_name}
                        className="shop-demand-item"
                    >

                        <div className="shop-demand-item-top">

                            <div className="shop-demand-item-name">

                                <span className="shop-demand-rank">
                                    {index + 1}
                                </span>

                                <strong>
                                    {item.item_name}
                                </strong>

                            </div>

                            <span className="shop-demand-quantity">
                                {item.quantity} sold
                            </span>

                        </div>

                        <div className="shop-demand-bar">
                            <div
                                className="shop-demand-bar-fill"
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />
                        </div>

                        <div className="shop-demand-meta">

                            <span>
                                {item.orders} orders
                            </span>

                            <span>
                                ₹{item.revenue} revenue
                            </span>

                        </div>

                    </div>
                );
            })}

    </div>

</section>


            {/* Bottom analytics */}

            <section className="shop-overview-bottom-grid">

                <div className="shop-overview-analysis-card">

                    <span className="eyebrow">
                        ORDER STATUS
                    </span>

                    <div className="shop-overview-status-list">

                        {overview.status_distribution.map(
                            (item) => (
                                <div
                                    key={item.status}
                                    className="shop-overview-status-row"
                                >
                                    <span>
                                        {item.status}
                                    </span>

                                    <strong>
                                        {item.count}
                                    </strong>
                                </div>
                            )
                        )}

                    </div>

                </div>


                <div className="shop-overview-analysis-card">

                    <div className="shop-overview-analysis-card">

    <div className="shop-overview-section-header">
        <div>
            <span className="eyebrow">
                REVENUE BY ITEM
            </span>

            <h2>
                Top Revenue Contributors
            </h2>
        </div>

        <span className="shop-overview-section-note">
            Based on item revenue
        </span>
    </div>

    <div className="shop-revenue-list">

        {[...overview.item_demand]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6)
            .map((item, index) => {

                const maxRevenue =
                    [...overview.item_demand]
                        .sort((a, b) => b.revenue - a.revenue)[0]
                        ?.revenue || 1;

                const percentage =
                    (item.revenue / maxRevenue) * 100;

                return (
                    <div
                        key={item.item_name}
                        className="shop-revenue-item"
                    >

                        <div className="shop-revenue-item-top">

                            <div className="shop-revenue-item-name">

                                <span className="shop-revenue-rank">
                                    {index + 1}
                                </span>

                                <strong>
                                    {item.item_name}
                                </strong>

                            </div>

                            <strong className="shop-revenue-value">
                                ₹{item.revenue}
                            </strong>

                        </div>

                        <div className="shop-revenue-bar">

                            <div
                                className="shop-revenue-bar-fill"
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />

                        </div>

                        <div className="shop-revenue-meta">

                            <span>
                                {item.quantity} sold
                            </span>

                            <span>
                                {item.orders} orders
                            </span>

                        </div>

                    </div>
                );
            })}

    </div>

</div>

                    

                </div>

            </section>

        </div>
    );
}

export default ShopOverview;