import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

function SpecialOffers({ onOfferClick }) {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
    loadOffers();
}, []);

useEffect(() => {
    if (offers.length <= 1) {
        return;
    }

    const interval = setInterval(() => {
        setActiveIndex((previous) =>
            (previous + 1) % offers.length
        );
    }, 4000);

    return () => clearInterval(interval);
}, [offers.length]);

    async function loadOffers() {
        try {
            setLoading(true);
            setError("");

            const data = await apiFetch("/customer/offers/live");

            setOffers(data || []);
        } catch (error) {
            console.error("Failed to load special offers:", error);
            setError(error.message || "Unable to load special offers.");
        } finally {
            setLoading(false);
        }
    }

    function getImageUrl(imageUrl) {
        if (!imageUrl) {
            return null;
        }

        return `http://127.0.0.1:8000${imageUrl}`;
    }

    function getDiscountLabel(offer) {
        if (offer.discount_type === "PERCENTAGE") {
            return `${offer.discount_value}% OFF`;
        }

        return `₹${Number(offer.discount_value).toFixed(0)} OFF`;
    }

    function getPreviousIndex() {
    if (offers.length <= 1) {
        return 0;
    }

    return (
        (activeIndex - 1 + offers.length) %
        offers.length
    );
}

function getNextIndex() {
    if (offers.length <= 1) {
        return 0;
    }

    return (
        (activeIndex + 1) %
        offers.length
    );
}

function selectOffer(index) {
    setActiveIndex(index);
}

    function handleOfferClick(offer) {
    onOfferClick(
        offer.shop_id,
        offer.offer_id
    );
}

function getCardPosition(index) {
    if (offers.length === 1) {
        return "center";
    }

    if (offers.length === 2) {
        return index === activeIndex
            ? "center"
            : "side";
    }

    const previousIndex = getPreviousIndex();
    const nextIndex = getNextIndex();

    if (index === activeIndex) {
        return "center";
    }

    if (index === previousIndex) {
        return "left";
    }

    if (index === nextIndex) {
        return "right";
    }

    return "hidden";
}
function getCardPosition(index) {
    if (offers.length === 1) {
        return "center";
    }

    if (offers.length === 2) {
        return index === activeIndex
            ? "center"
            : "side";
    }

    const previousIndex = getPreviousIndex();
    const nextIndex = getNextIndex();

    if (index === activeIndex) {
        return "center";
    }

    if (index === previousIndex) {
        return "left";
    }

    if (index === nextIndex) {
        return "right";
    }

    return "hidden";
}

    if (loading) {
        return (
            <section className="special-offers-section">
                <div className="special-offers-heading">
                    <span className="eyebrow">SPECIAL OFFERS</span>
                    <h2>Today's Offers</h2>
                </div>

                <p className="status-text">
                    Loading special offers...
                </p>
            </section>
        );
    }

    if (error || offers.length === 0) {
        return null;
    }

    return (
        <section className="special-offers-section">

            <div className="special-offers-heading">
                <div>
                    <span className="eyebrow">
                        SPECIAL OFFERS
                    </span>

                    <h2>
                        Deals you don't want to miss
                    </h2>

                    <p>
                        Enjoy exclusive offers from Foodly restaurants.
                    </p>
                </div>
            </div>

<div className="special-offers-carousel">

{offers.length > 1 && (
    <>
        <button
            type="button"
            className="special-offer-nav special-offer-prev"
            onClick={() => setActiveIndex(getPreviousIndex())}
            aria-label="Previous offer"
        >
            ‹
        </button>

        <button
            type="button"
            className="special-offer-nav special-offer-next"
            onClick={() => setActiveIndex(getNextIndex())}
            aria-label="Next offer"
        >
            ›
        </button>
    </>
)}


    {offers.map((offer, index) => {

        const position = getCardPosition(index);
        const imageUrl = getImageUrl(offer.image_url);
        const isCenter = position === "center";

        return (
            <article
                key={offer.offer_id}
                className={`special-offer-card special-offer-${position}`}
                onClick={() => selectOffer(index)}
            >

                <div className="special-offer-image-wrapper">

                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={offer.title}
                            className="special-offer-image"
                        />
                    ) : (
                        <div className="special-offer-image-placeholder">
                            Foodly
                        </div>
                    )}

                    <span className="special-offer-discount">
                        {getDiscountLabel(offer)}
                    </span>

                </div>

                {isCenter && (
                    <div className="special-offer-content">

                        <h3>
                            {offer.title}
                        </h3>

                        {offer.description && (
                            <p>
                                {offer.description}
                            </p>
                        )}

                        <div className="special-offer-dates">

                            <span>
                                Starts{" "}
                                {new Date(
                                    offer.start_at
                                ).toLocaleDateString()}
                            </span>

                            <span>
                                Ends{" "}
                                {new Date(
                                    offer.end_at
                                ).toLocaleDateString()}
                            </span>

                        </div>

                        <button
                            type="button"
                            className="special-offer-button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleOfferClick(offer);
                            }}
                        >
                            View Offer
                        </button>

                    </div>
                )}

            </article>
        );
    })}

</div>

        </section>
    );
}

export default SpecialOffers;