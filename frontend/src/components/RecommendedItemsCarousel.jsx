import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import "../styles/RecommendedItemsCarousel.css";

const API_ORIGIN = "http://127.0.0.1:8000";

function imageSrc(path) {
    if (!path) return "";
    return path.startsWith("http://") || path.startsWith("https://")
        ? path
        : `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function RecommendedItemsCarousel({ onItemClick }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const viewportRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRecommendations() {
            try {
                const data = await apiFetch("/customer/recommendations?limit=10");
                if (!cancelled) {
                    setItems(Array.isArray(data) ? data : []);
                    setFailed(false);
                }
            } catch (error) {
                console.error("Failed to load recommended items:", error);
                if (!cancelled) {
                    setItems([]);
                    setFailed(true);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRecommendations();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track || items.length === 0) return undefined;

        let frameId;
        const updateCenterItem = () => {
            const viewportRect = viewport.getBoundingClientRect();
            const centerX = viewportRect.left + viewportRect.width / 2;
            let closest = null;
            let closestDistance = Infinity;

            track.querySelectorAll(".recommended-food-item").forEach((node) => {
                const rect = node.getBoundingClientRect();
                const distance = Math.abs((rect.left + rect.width / 2) - centerX);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = node;
                }
            });

            track.querySelectorAll(".recommended-food-item.is-centered").forEach((node) => {
                node.classList.remove("is-centered");
            });
            if (closest) closest.classList.add("is-centered");
            frameId = window.requestAnimationFrame(updateCenterItem);
        };

        frameId = window.requestAnimationFrame(updateCenterItem);
        return () => window.cancelAnimationFrame(frameId);
    }, [items]);

    if (loading) {
        return (
            <section className="recommended-carousel-section" aria-label="Recommended food">
                <div className="recommended-carousel-heading">
                    <span className="recommended-carousel-kicker">MADE FOR YOU</span>
                    <h2>Picked just for you</h2>
                </div>
                <p className="recommended-carousel-status">Finding something delicious…</p>
            </section>
        );
    }

    if (failed || items.length === 0) return null;

    // Duplicate the sequence so the continuous marquee can loop without a visible gap.
    const loopItems = [...items, ...items];

    return (
        <section className="recommended-carousel-section" aria-label="Recommended food">
            <div className="recommended-carousel-heading">
                <span className="recommended-carousel-kicker">MADE FOR YOU</span>
                <h2>Picked just for you</h2>
                <p>A little something we think you’ll love.</p>
            </div>

            <div className="recommended-carousel-viewport" ref={viewportRef}>
                <div className="recommended-carousel-track" ref={trackRef}>
                    {loopItems.map((item, index) => (
                        <button
                            type="button"
                            className="recommended-food-item"
                            key={`${item.item_id}-${index}`}
                            onClick={() => onItemClick?.(item)}
                            aria-label={`Open ${item.item_name} from ${item.shop_name}`}
                            title={`${item.item_name} · ${item.shop_name}`}
                        >
                            <span className="recommended-food-image-wrap">
                                {item.image_url ? (
                                    <img
                                        src={imageSrc(item.image_url)}
                                        alt={item.item_name}
                                        className="recommended-food-image"
                                        loading="lazy"
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                            event.currentTarget.nextElementSibling?.classList.remove("is-hidden");
                                        }}
                                    />
                                ) : null}
                                <span className={`recommended-food-image-fallback ${item.image_url ? "is-hidden" : ""}`}>
                                    {item.item_name?.trim()?.charAt(0)?.toUpperCase() || "🍽"}
                                </span>
                            </span>
                            <span className="recommended-food-name">{item.item_name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RecommendedItemsCarousel;
