import React from "react";
import "../../styles/EditorialPopTemplate.css";

const DEFAULTS = {
  background_color: "#101010",
  accent_color: "#FF4A26",
  text_color: "#FFF7ED",
  paper_color: "#FFF8EF",
  reveal_color: "#FF8A18",
  brand_symbol: "🔥",
  brand_subtitle: "RESTAURANT",
  tagline: "GOOD FOOD\nHAPPIER PEOPLE",
  badge_heading: "GET",
  badge_footer: "OFF",
  badge_text: "LIMITED TIME OFFER",
  side_note: "ON SELECTED ITEMS",
  feature_one: "DELICIOUS FLAVOURS",
  feature_two: "FRESH INGREDIENTS",
  feature_three: "GREAT TIMES",
  image_x: 50,
  image_y: 50,
  image_zoom: 100,
  headline_size: 48,
  restaurant_size: 56,
  discount_size: 34,
  show_tagline: true,
  show_side_note: true,
  show_features: true,
  show_brand_symbol: true,
  show_hanging_badge: true,
};

function discountText(offer) {
  const value = offer.discount_value ?? offer.discount_percentage ?? offer.discount ?? 25;
  return String(value).includes("%") ? String(value) : `${value}%`;
}

export default function EditorialPopTemplate({ offer = {}, config = {} }) {
  const s = { ...DEFAULTS, ...config };
  const restaurant = offer.shop_name || offer.restaurant_name || offer.shop || "BURNO";
  const headline = offer.offer_title || offer.title || "A FEAST TO REMEMBER";
  const description = offer.description || "Discover irresistible flavours at an unforgettable price.";
  const image = offer.image_url || offer.image || offer.food_image || "";
  const discount = discountText(offer);

  const style = {
    "--ep-background": s.background_color,
    "--ep-accent": s.accent_color,
    "--ep-text": s.text_color,
    "--ep-paper": s.paper_color,
    "--ep-reveal": s.reveal_color,
    "--ep-headline-size": `${s.headline_size ?? 48}px`,
    "--ep-brand-size": `${s.restaurant_size ?? 56}px`,
    "--ep-discount-size": `${s.discount_size ?? 34}px`,
  };

  return (
    <article className="editorial-pop editorial-pop--torn" style={style}>
      <div className="editorial-pop__glow" aria-hidden="true" />
      <div className="editorial-pop__grain" aria-hidden="true" />
      <span className="editorial-pop__spark editorial-pop__spark--one" aria-hidden="true">✦</span>
      <span className="editorial-pop__spark editorial-pop__spark--two" aria-hidden="true">✳</span>

      <header className="editorial-pop__topline">
        <div className="editorial-pop__brand">
          {s.show_brand_symbol && <span className="editorial-pop__brand-symbol">{s.brand_symbol}</span>}
          <div className="editorial-pop__brand-copy">
            <div className="editorial-pop__restaurant-name">{restaurant}</div>
            <div className="editorial-pop__brand-subtitle">{s.brand_subtitle}</div>
          </div>
        </div>
        <div className="editorial-pop__top-message">
          <span /> MADE FOR FOOD LOVERS <span />
        </div>
      </header>

      <div className="editorial-pop__layout">
        <section className="editorial-pop__copy">
          {s.show_tagline && (
            <div className="editorial-pop__tagline">
              {String(s.tagline || "").split("\n").map((line, i) => (
                <span key={`${line}-${i}`}>{line}</span>
              ))}
            </div>
          )}
          <div className="editorial-pop__eyebrow">{s.badge_text}</div>
          <h2 className="editorial-pop__headline">{headline}</h2>
          <p className="editorial-pop__description">{description}</p>
          <div className="editorial-pop__signature">
            <span className="editorial-pop__signature-rule" />
            <div>
              <span className="editorial-pop__signature-label">EXCLUSIVELY AT</span>
              <span className="editorial-pop__signature-name">{restaurant}</span>
            </div>
          </div>
        </section>

        <section className="editorial-pop__visual">
          <div className="editorial-pop__reveal-glow" aria-hidden="true" />
          <div className="editorial-pop__paper-shadow" aria-hidden="true" />
          <div className="editorial-pop__paper">
            <div className="editorial-pop__food-window">
              {image ? (
                <img
                  className="editorial-pop__food-image"
                  src={image}
                  alt={`${restaurant} featured food`}
                  style={{
                    objectPosition: `${s.image_x ?? 50}% ${s.image_y ?? 50}%`,
                    transform: `scale(${(s.image_zoom ?? 100) / 100})`,
                  }}
                />
              ) : (
                <div className="editorial-pop__placeholder">
                  <span>✳</span>
                  <strong>YOUR FOOD, FRONT AND CENTRE</strong>
                  <small>Upload a food photograph to get started.</small>
                </div>
              )}
              <div className="editorial-pop__image-shade" />
            </div>
          </div>

          {s.show_hanging_badge && (
            <div className="editorial-pop__hanging-badge">
              <span className="editorial-pop__rope" />
              <div className="editorial-pop__discount-badge">
                <span className="editorial-pop__badge-heading">{s.badge_heading}</span>
                <span className="editorial-pop__discount-number">{discount}</span>
                <span className="editorial-pop__badge-footer">{s.badge_footer}</span>
              </div>
            </div>
          )}

          {s.show_side_note && (
            <div className="editorial-pop__side-note">
              <span className="editorial-pop__side-arrow">↙</span>
              <span>{s.side_note}</span>
              <span className="editorial-pop__side-underline" />
            </div>
          )}
        </section>
      </div>

      {s.show_features && (
        <footer className="editorial-pop__footer">
          <div className="editorial-pop__feature"><span>♨</span><b>{s.feature_one}</b></div>
          <i />
          <div className="editorial-pop__feature"><span>✦</span><b>{s.feature_two}</b></div>
          <i />
          <div className="editorial-pop__feature"><span>♡</span><b>{s.feature_three}</b></div>
        </footer>
      )}
    </article>
  );
}
