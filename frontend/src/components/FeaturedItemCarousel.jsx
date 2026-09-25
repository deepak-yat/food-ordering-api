import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api/client";
import FeaturedItemCard from "./FeaturedItemCard";

function FeaturedItemsCarousel({ onAddToCart }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const trackRef = useRef(null);
    const pausedRef = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch(
                    "/customer/featured-items?limit=10"
                );

                setItems(data || []);
            } catch (error) {
                console.error(
                    "Failed to load featured items:",
                    error
                );

                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (items.length <= 1) {
            return;
        }

        const interval = setInterval(() => {
            if (
                pausedRef.current ||
                !trackRef.current
            ) {
                return;
            }

            const track = trackRef.current;

            const cardWidth =
                track.firstChild?.offsetWidth ?? 0;

            const atEnd =
                track.scrollLeft +
                    track.clientWidth >=
                track.scrollWidth - 4;

            track.scrollTo({
                left: atEnd
                    ? 0
                    : track.scrollLeft +
                      cardWidth +
                      16,
                behavior: "smooth",
            });
        }, 4000);

        return () => {
            clearInterval(interval);
        };
    }, [items.length]);

    function scrollByCard(direction) {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        const cardWidth =
            track.firstChild?.offsetWidth ?? 300;

        track.scrollBy({
            left:
                direction *
                (cardWidth + 16),
            behavior: "smooth",
        });
    }

    if (loading) {
        return null;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            className="featured-picks-section"
            onMouseEnter={() => {
                pausedRef.current = true;
            }}
            onMouseLeave={() => {
                pausedRef.current = false;
            }}
        >
            <div className="featured-picks-heading">
                <div>
                    <h2>👑 Featured Picks</h2>

                    <p>
                        Handpicked delicious items from
                        your favorite restaurants
                    </p>
                </div>

                <span className="featured-picks-pill">
                    ✨ New picks every day
                </span>
            </div>

            <div className="featured-picks-carousel">
                {items.length > 1 && (
                    <button
                        type="button"
                        className="featured-picks-nav featured-picks-prev"
                        onClick={() =>
                            scrollByCard(-1)
                        }
                        aria-label="Previous items"
                    >
                        ‹
                    </button>
                )}

                <div
                    className="featured-picks-track"
                    ref={trackRef}
                >
                    {items.map((item) => (
                        <FeaturedItemCard
                            key={`${item.shop_id}-${item.item_id}`}
                            item={item}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>

                {items.length > 1 && (
                    <button
                        type="button"
                        className="featured-picks-nav featured-picks-next"
                        onClick={() =>
                            scrollByCard(1)
                        }
                        aria-label="Next items"
                    >
                        ›
                    </button>
                )}
            </div>
        </section>
    );
}

export default FeaturedItemsCarousel;