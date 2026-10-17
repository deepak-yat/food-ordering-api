import { useEffect, useState } from "react";
import "../../styles/PremiumFeastTemplate.css";

function PremiumFeastTemplate({ offer = {}, preview = false }) {
    const config = offer.design_config || {};

    // General appearance
    const accentColor = config.accent_color || "#D4AF37";
    const badgeText = config.badge_text || "EXCLUSIVE OFFER";
    const animationEnabled = config.animation_enabled !== false;
    const backgroundColor = config.background_color || "#100F0B";

    // Image settings
    const imageUrl = config.preview_image_url || offer.image_url || null;
    const autoColors = config.auto_colors !== false;
    const imageBlend = config.image_blend !== false;

    const imagePositionX = Number(config.image_position_x ?? 50);
    const imagePositionY = Number(config.image_position_y ?? 50);

    // Typography
    const titleSize = Number(config.title_size) || 40;
    const textAlignment = config.text_alignment || "left";

    // Extracted image color
    const [imageColor, setImageColor] = useState(accentColor);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        setImageFailed(false);

        if (!imageUrl) {
            setImageColor(accentColor);
            return undefined;
        }

        if (!autoColors) {
            setImageColor(accentColor);
            return undefined;
        }

        const image = new Image();

        image.onload = () => {
            if (cancelled) return;

            try {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", {
                    willReadFrequently: true,
                });

                if (!context) {
                    setImageColor(accentColor);
                    return;
                }

                const sampleSize = 24;

                canvas.width = sampleSize;
                canvas.height = sampleSize;

                context.drawImage(
                    image,
                    0,
                    0,
                    sampleSize,
                    sampleSize
                );

                const pixels = context.getImageData(
                    0,
                    0,
                    sampleSize,
                    sampleSize
                ).data;

                let red = 0;
                let green = 0;
                let blue = 0;
                let count = 0;

                // Sample opaque pixels to calculate an average color.
                for (
                    let index = 0;
                    index < pixels.length;
                    index += 4
                ) {
                    const alpha = pixels[index + 3];

                    if (alpha < 100) continue;

                    red += pixels[index];
                    green += pixels[index + 1];
                    blue += pixels[index + 2];

                    count++;
                }

                if (count === 0) {
                    setImageColor(accentColor);
                    return;
                }

                const averageRed = Math.round(red / count);
                const averageGreen = Math.round(green / count);
                const averageBlue = Math.round(blue / count);

                if (!cancelled) {
                    setImageColor(
                        `rgb(${averageRed}, ${averageGreen}, ${averageBlue})`
                    );
                }
            } catch {
                // Canvas access can fail for images blocked by CORS.
                // The image can still be displayed normally.
                if (!cancelled) {
                    setImageColor(accentColor);
                }
            }
        };

        image.onerror = () => {
            if (!cancelled) {
                setImageFailed(true);
                setImageColor(accentColor);
            }
        };

        // Blob URLs and same-origin URLs work without cross-origin mode.
        // Remote images can be sampled when their server permits CORS.
        image.crossOrigin = "anonymous";
        image.src = imageUrl;

        return () => {
            cancelled = true;
        };
    }, [imageUrl, autoColors, accentColor]);

    // Offer information
    const discountValue = Number(offer.discount_value) || 0;

    const discountText =
        offer.discount_type === "PERCENTAGE"
            ? `${discountValue}% OFF`
            : `₹${discountValue}`;

    const shopName = offer.shop_name || "FOODLY EXCLUSIVE";

    const title = offer.title || "A Feast Worth Celebrating";

    const description =
        offer.description ||
        "Discover exceptional flavours at a special price.";

const customStyle = {
    "--feast-accent": accentColor,
    "--feast-image-color": imageColor,
    "--feast-background": backgroundColor,
    "--feast-title-size": `${titleSize}px`,
    "--feast-image-x": `${imagePositionX}%`,
    "--feast-image-y": `${imagePositionY}%`,
    "--feast-text-align": textAlignment,
    "--feast-content-align":
        textAlignment === "center"
            ? "center"
            : textAlignment === "right"
              ? "flex-end"
              : "flex-start",
};

    return (
        <article
            className={[
                "premium-feast",
                animationEnabled ? "premium-feast--animated" : "",
                preview ? "premium-feast--preview" : "",
                imageBlend ? "premium-feast--image-blend" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            style={customStyle}
        >
            {/* Decorative background texture */}
            <div
                className="premium-feast__texture"
                aria-hidden="true"
            />

            {/* Offer information */}
            <div className="premium-feast__content">
                <span className="premium-feast__badge">
                    <span
                        className="premium-feast__badge-dot"
                        aria-hidden="true"
                    />

                    {badgeText}
                </span>

                <p className="premium-feast__shop">
                    {shopName}
                </p>

                <h3 className="premium-feast__title">
                    {title}
                </h3>

                <p className="premium-feast__description">
                    {description}
                </p>

                <div className="premium-feast__discount">
                    <span className="premium-feast__discount-value">
                        {discountText}
                    </span>

                    <span className="premium-feast__discount-caption">
                        A SPECIAL TREAT FOR YOU
                    </span>
                </div>

                {Array.isArray(offer.items) &&
                    offer.items.length > 0 && (
                        <p className="premium-feast__eligibility">
                            Available on selected items
                        </p>
                    )}
            </div>

            {/* Image and ambient lighting */}
            <div className="premium-feast__visual">
                {imageUrl && !imageFailed ? (
                    <img
                        key={imageUrl}
                        className="premium-feast__image"
                        src={imageUrl}
                        alt={title}
                        loading="eager"
                        style={{
                            objectPosition:
                                `${imagePositionX}% ${imagePositionY}%`,
                        }}
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div
                        className="premium-feast__image-placeholder"
                        aria-hidden="true"
                    >
                        <span>✦</span>
                        <span>FOODLY</span>
                    </div>
                )}

                <div
                    className="premium-feast__image-glow"
                    aria-hidden="true"
                />
            </div>

            {/* Decorative ornament */}
            <div
                className="premium-feast__ornament"
                aria-hidden="true"
            />
        </article>
    );
}

export default PremiumFeastTemplate;