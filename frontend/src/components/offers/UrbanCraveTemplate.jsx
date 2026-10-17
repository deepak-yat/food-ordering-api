import React from "react";
import "../../styles/UrbanCraveTemplate.css";

function UrbanCraveTemplate({ offer = {}, preview = false }) {
  const config = offer.design_config || {};

  const accentColor = config.accent_color || "#D7FF00";
  const backgroundColor = config.background_color || "#111111";

  const imageUrl =
    config.image_url ||
    offer.image_url ||
    offer.food_image_url ||
    "";

  const title =
    offer.title ||
    offer.offer_title ||
    "THE CRAVE EVENT";

  const shopName =
    offer.shop_name ||
    offer.restaurant_name ||
    "YOUR RESTAURANT";

  const description =
    offer.description ||
    "Big flavours. Bold deals. Made for serious food lovers.";

  const discountValue =
    offer.discount_percentage ??
    offer.discount_percent ??
    offer.discount ??
    40;

  const discountLabel =
    discountValue === "" ? "0%" : `${discountValue}%`;

  const badgeText =
    config.badge_text || "LIMITED TIME OFFER";

  const customStyle = {
    "--urban-accent": accentColor,
    "--urban-background": backgroundColor,
    "--urban-title-size": `${config.title_size ?? 58}px`,
    "--urban-text-align": config.text_alignment || "left",
    "--urban-image-x": `${config.image_position_x ?? 50}%`,
    "--urban-image-y": `${config.image_position_y ?? 50}%`,
    "--urban-image-zoom": (config.image_zoom ?? 100) / 100,  };

  return (
    <section
      className={`urban-crave ${
        preview ? "urban-crave--preview" : ""
      }`}
      style={customStyle}
    >
      <div className="urban-crave__grid" />

      <header className="urban-crave__header">
        <div className="urban-crave__brand">
          <span className="urban-crave__brand-mark">U.</span>
          <span>FOODLY CAMPAIGNS</span>
        </div>

        <div className="urban-crave__edition">
          <span className="urban-crave__edition-dot" />
          FOOD THAT HITS DIFFERENT
        </div>
      </header>

      <div className="urban-crave__body">
        <div className="urban-crave__copy">
          <div className="urban-crave__badge">
            <span>✳</span>
            {badgeText}
          </div>

          <p className="urban-crave__eyebrow">
            THIS IS YOUR SIGN TO INDULGE
          </p>

          <h1 className="urban-crave__title">{title}</h1>

          <div className="urban-crave__shop">
            {shopName}
          </div>

          <p className="urban-crave__description">
            {description}
          </p>

          <div className="urban-crave__discount">
            <span className="urban-crave__discount-number">
              {discountLabel}
            </span>

            <span className="urban-crave__discount-word">
              OFF
            </span>
          </div>

          <div className="urban-crave__offer-line">
            <span />
            <p>GOOD FOOD. BETTER DEALS.</p>
            <span />
          </div>
        </div>

        <div className="urban-crave__visual">
          <div className="urban-crave__visual-frame">
            {imageUrl ? (
              <img
                className="urban-crave__food-image"
                src={imageUrl}
                alt={shopName}
              />
            ) : (
              <div className="urban-crave__image-placeholder">
                <span>🍔</span>
                <p>YOUR FOOD IMAGE</p>
                <small>
                  Upload an image in the customiser
                </small>
              </div>
            )}

            <div className="urban-crave__image-shade" />

            <div className="urban-crave__image-caption">
              <span>FRESHLY MADE</span>
              <span>● FOODLY SELECT</span>
            </div>
          </div>

          <div className="urban-crave__side-label">
            TASTE THE DIFFERENCE
          </div>

          <div className="urban-crave__floating-stamp">
            <span>HOT</span>
            <strong>DEAL</strong>
            <span>ALERT!</span>
          </div>

          <div className="urban-crave__number">03</div>
        </div>
      </div>

      <footer className="urban-crave__footer">
        <span>MADE FOR THE HUNGRY.</span>

        <span className="urban-crave__footer-center">
          <span />
          BIG TASTE ENERGY
          <span />
        </span>

        <span>FOODLY / URBAN CRAVE</span>
      </footer>
    </section>
  );
}

export default UrbanCraveTemplate;