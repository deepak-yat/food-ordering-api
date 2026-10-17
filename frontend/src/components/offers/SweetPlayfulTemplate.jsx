import { useEffect, useState } from "react";
import "../../styles/SweetPlayfulTemplate.css";

function SweetPlayfulTemplate({ offer = {}, preview = false }) {
    const config = offer.design_config || {};

    const accentColor = config.accent_color || "#FF7B8A";
    const backgroundColor = config.background_color || "#FFF3EB";
    const badgeText = config.badge_text || "SWEET DEALS";
    const animationEnabled = config.animation_enabled !== false;

    const leftImage =
        config.left_image_url || offer.left_image_url || null;

    const rightImage =
        config.right_image_url || offer.right_image_url || null;

    const imagePositionX = Number(config.image_position_x ?? 50);
    const imagePositionY = Number(config.image_position_y ?? 50);
    const rightImagePositionX = Number(
        config.right_image_position_x ?? 50
    );
    const rightImagePositionY = Number(
        config.right_image_position_y ?? 50
    );

    const titleSize = Number(config.title_size) || 40;
    const textAlignment = config.text_alignment || "center";
    const imageBlend = config.image_blend !== false;

    const [leftImageFailed, setLeftImageFailed] = useState(false);
    const [rightImageFailed, setRightImageFailed] = useState(false);
    const [leftImageColor, setLeftImageColor] = useState("#FFC2C9");
    const [rightImageColor, setRightImageColor] = useState("#DCCBFF");

    useEffect(() => {
        let cancelled = false;

        setLeftImageFailed(false);
        setRightImageFailed(false);

        const extractImageColor = (imageUrl, setColor) => {
            if (!imageUrl) {
                setColor("#FFC2C9");
                return () => {};
            }

            const image = new Image();

            image.onload = () => {
                if (cancelled) return;

                try {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d", {
                        willReadFrequently: true,
                    });

                    if (!context) return;

                    canvas.width = 20;
                    canvas.height = 20;

                    context.drawImage(image, 0, 0, 20, 20);

                    const pixels = context.getImageData(
                        0,
                        0,
                        20,
                        20
                    ).data;

                    let red = 0;
                    let green = 0;
                    let blue = 0;
                    let count = 0;

                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i + 3] < 100) continue;

                        red += pixels[i];
                        green += pixels[i + 1];
                        blue += pixels[i + 2];
                        count++;
                    }

                    if (count && !cancelled) {
                        setColor(
                            `rgb(${Math.round(red / count)}, ${Math.round(
                                green / count
                            )}, ${Math.round(blue / count)})`
                        );
                    }
                } catch {
                    // Cross-origin images may prevent canvas color extraction.
                    // The default ambient color will remain in place.
                }
            };

            image.onerror = () => {
                if (!cancelled) {
                    if (imageUrl === leftImage) {
                        setLeftImageFailed(true);
                    } else {
                        setRightImageFailed(true);
                    }
                }
            };

            image.crossOrigin = "anonymous";
            image.src = imageUrl;

            return () => {
                image.onload = null;
                image.onerror = null;
            };
        };

        const cleanupLeft = extractImageColor(
            leftImage,
            setLeftImageColor
        );

        const cleanupRight = extractImageColor(
            rightImage,
            setRightImageColor
        );

        return () => {
            cancelled = true;
            cleanupLeft();
            cleanupRight();
        };
    }, [leftImage, rightImage]);

    const discountValue = Number(offer.discount_value) || 0;

    const discountText =
        offer.discount_type === "PERCENTAGE"
            ? `${discountValue}% OFF`
            : `₹${discountValue}`;

    const shopName = offer.shop_name || "YOUR FAVOURITE RESTAURANT";
    const title = offer.title || "A Feast Full of Happiness";
    const description =
        offer.description ||
        "Delicious moments taste even better with a special deal.";

    const customStyle = {
        "--playful-accent": accentColor,
        "--playful-background": backgroundColor,
        "--playful-left-glow": leftImageColor,
        "--playful-right-glow": rightImageColor,
        "--playful-title-size": `${titleSize}px`,
        "--playful-text-align": textAlignment,
        "--playful-image-x": `${imagePositionX}%`,
        "--playful-image-y": `${imagePositionY}%`,
        "--playful-right-image-x": `${rightImagePositionX}%`,
        "--playful-right-image-y": `${rightImagePositionY}%`,
    };

    return (
        <article
            className={[
                "sweet-playful",
                animationEnabled ? "sweet-playful--animated" : "",
                imageBlend ? "sweet-playful--image-blend" : "",
                preview ? "sweet-playful--preview" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            style={customStyle}
        >
            <div
                className="sweet-playful__decoration sweet-playful__decoration--one"
                aria-hidden="true"
            />

            <div
                className="sweet-playful__decoration sweet-playful__decoration--two"
                aria-hidden="true"
            />

            {/* LEFT FOOD IMAGE */}
            <div className="sweet-playful__visual sweet-playful__visual--left">
                {leftImage && !leftImageFailed ? (
                    <img
                        key={leftImage}
                        className="sweet-playful__image sweet-playful__image--left"
                        src={leftImage}
                        alt={`${title} — first food image`}
                        style={{
                            objectPosition: `${imagePositionX}% ${imagePositionY}%`,
                        }}
                        onError={() => setLeftImageFailed(true)}
                    />
                ) : (
                    <div className="sweet-playful__placeholder">
                        <span aria-hidden="true">🍜</span>
                        <small>FOOD IMAGE 1</small>
                    </div>
                )}

                <div
                    className="sweet-playful__image-glow"
                    aria-hidden="true"
                />
            </div>

            {/* CENTRAL OFFER CONTENT */}
            <div className="sweet-playful__content">
                <div className="sweet-playful__badge">
                    <span aria-hidden="true">✦</span>
                    {badgeText}
                    <span aria-hidden="true">✦</span>
                </div>

                <p className="sweet-playful__shop">{shopName}</p>

                <h2 className="sweet-playful__title">{title}</h2>

                <p className="sweet-playful__description">
                    {description}
                </p>

                <div className="sweet-playful__discount">
                    <span className="sweet-playful__discount-small">
                        A LITTLE SOMETHING SPECIAL
                    </span>

                    <strong className="sweet-playful__discount-value">
                        {discountText}
                    </strong>
                </div>

                <span className="sweet-playful__footer">
                    Made for your happy moments
                    <span aria-hidden="true"> ♡</span>
                </span>
            </div>

            {/* RIGHT FOOD IMAGE */}
            <div className="sweet-playful__visual sweet-playful__visual--right">
                {rightImage && !rightImageFailed ? (
                    <img
                        key={rightImage}
                        className="sweet-playful__image sweet-playful__image--right"
                        src={rightImage}
                        alt={`${title} — second food image`}
                        style={{
                            objectPosition: `${rightImagePositionX}% ${rightImagePositionY}%`,
                        }}
                        onError={() => setRightImageFailed(true)}
                    />
                ) : (
                    <div className="sweet-playful__placeholder">
                        <span aria-hidden="true">🍛</span>
                        <small>FOOD IMAGE 2</small>
                    </div>
                )}

                <div
                    className="sweet-playful__image-glow"
                    aria-hidden="true"
                />
            </div>

            <div
                className="sweet-playful__sparkle sweet-playful__sparkle--one"
                aria-hidden="true"
            >
                ✦
            </div>

            <div
                className="sweet-playful__sparkle sweet-playful__sparkle--two"
                aria-hidden="true"
            >
                ✧
            </div>
        </article>
    );
}

export default SweetPlayfulTemplate;