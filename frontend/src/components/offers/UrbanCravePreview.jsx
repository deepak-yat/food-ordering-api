import React, { useEffect, useRef, useState } from "react";
import UrbanCraveTemplate from "./UrbanCraveTemplate";
import "../../styles/UrbanCravePreview.css";

const DEFAULTS = {
  accent_color: "#D7FF00",
  background_color: "#111111",
  badge_text: "LIMITED TIME OFFER",
  title_size: 58,
  text_alignment: "left",
  image_position_x: 50,
  image_position_y: 50,
  image_zoom: 100,
  auto_background: true,
  auto_accent: true,
};

const DEFAULT_OFFER = {
  title: "THE CRAVE EVENT",
  shop_name: "YOUR RESTAURANT",
  description: "Big flavours. Bold deals. Made for serious food lovers.",
  discount_percentage: 40,
};

const PALETTES = [
  { name: "Electric Lime", accent: "#D7FF00", background: "#111111" },
  { name: "Inferno", accent: "#FF5722", background: "#17100E" },
  { name: "Cyber Blue", accent: "#00E5FF", background: "#07141B" },
  { name: "Hot Pink", accent: "#FF4FA3", background: "#190B15" },
  { name: "Golden Hour", accent: "#FFC145", background: "#1C1510" },
  { name: "Purple Haze", accent: "#D69CFF", background: "#171020" },
];

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((value) =>
        Math.round(value).toString(16).padStart(2, "0")
      )
      .join("")
  ).toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;

    s =
      l > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }

    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [chroma, x, 0];
  else if (h < 120) [r, g, b] = [x, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, x];
  else if (h < 240) [r, g, b] = [0, x, chroma];
  else if (h < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  return rgbToHex(
    (r + m) * 255,
    (g + m) * 255,
    (b + m) * 255
  );
}

/*
 * Samples the uploaded image and derives:
 * 1. A dark background colour based on the image's average colour.
 * 2. A bright complementary accent colour.
 *
 * This is a lightweight image-colour estimate, not a full
 * dominant-colour or AI image-understanding algorithm.
 */
function analyseImage(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error("No image provided."));
      return;
    }

    const image = new Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!context) {
          throw new Error("Canvas is unavailable.");
        }

        const sampleSize = 40;

        canvas.width = sampleSize;
        canvas.height = sampleSize;

        context.drawImage(image, 0, 0, sampleSize, sampleSize);

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

        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 30) continue;

          red += pixels[i];
          green += pixels[i + 1];
          blue += pixels[i + 2];
          count++;
        }

        if (!count) {
          throw new Error("Could not sample image colours.");
        }

        red /= count;
        green /= count;
        blue /= count;

        const [hue] = rgbToHsl(red, green, blue);

        /*
         * Darken the sampled average to create a background
         * that keeps the white typography readable.
         */
        const background = rgbToHex(
          red * 0.22,
          green * 0.22,
          blue * 0.22
        );

        /*
         * Shift the average hue to create a bright accent.
         */
        const accent = hslToHex(
          hue + 150,
          95,
          62
        );

        resolve({ background, accent });
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error("Unable to analyse this image."));
    };

    /*
     * Local object URLs work with canvas. For remote image URLs,
     * CORS permissions may be required.
     */
    if (!imageUrl.startsWith("blob:") &&
        !imageUrl.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }

    image.src = imageUrl;
  });
}

function UrbanCravePreview() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [offer, setOffer] = useState(DEFAULT_OFFER);

  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageError, setImageError] = useState("");
  const [autoColors, setAutoColors] = useState(null);
  const [colorStatus, setColorStatus] = useState("");

  const fileInputRef = useRef(null);
  const objectUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  /*
   * Reanalyse the image whenever it changes while automatic
   * colour selection is enabled.
   */
  useEffect(() => {
    let cancelled = false;

    if (!imageUrl) {
      setAutoColors(null);
      setColorStatus("");
      return undefined;
    }

    if (!settings.auto_background && !settings.auto_accent) {
      setColorStatus("Manual colours enabled.");
      return undefined;
    }

    setColorStatus("Analysing image colours...");

    analyseImage(imageUrl)
      .then((colors) => {
        if (cancelled) return;

        setAutoColors(colors);
        setColorStatus("Image colours analysed.");
      })
      .catch(() => {
        if (cancelled) return;

        setColorStatus(
          "Automatic colours unavailable. You can select them manually."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [
    imageUrl,
    settings.auto_background,
    settings.auto_accent,
  ]);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateOffer = (key, value) => {
    setOffer((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setImageError("Image must be smaller than 8 MB.");
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);

    objectUrlRef.current = objectUrl;

    setImageUrl(objectUrl);
    setImageName(file.name);
    setImageError("");
  };

  const removeImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setImageUrl("");
    setImageName("");
    setImageError("");
    setAutoColors(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetSettings = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setSettings(DEFAULTS);
    setOffer(DEFAULT_OFFER);
    setImageUrl("");
    setImageName("");
    setImageError("");
    setAutoColors(null);
    setColorStatus("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const applyPalette = (palette) => {
    setSettings((previous) => ({
      ...previous,
      accent_color: palette.accent,
      background_color: palette.background,
      auto_background: false,
      auto_accent: false,
    }));

    setColorStatus("Custom palette selected.");
  };

  const effectiveBackground =
    settings.auto_background && autoColors
      ? autoColors.background
      : settings.background_color;

  const effectiveAccent =
    settings.auto_accent && autoColors
      ? autoColors.accent
      : settings.accent_color;

  const previewOffer = {
    ...offer,
    image_url: imageUrl,
    design_config: {
      ...settings,
      image_url: imageUrl,
      accent_color: effectiveAccent,
      background_color: effectiveBackground,
    },
  };

  return (
    <main className="urban-preview-page">
      <header className="urban-preview-header">
        <div>
          <div className="urban-preview-eyebrow">
            FOODLY / OFFER DESIGN STUDIO
          </div>

          <h1>
            Urban <span>Crave.</span>
          </h1>

          <p>
            Bold campaigns. Big flavours. Your offer, your style.
          </p>
        </div>

        <button
          type="button"
          className="urban-preview-reset"
          onClick={resetSettings}
        >
          Reset design ↺
        </button>
      </header>

      <section className="urban-preview-workspace">
        <div className="urban-preview-stage">
          <div className="urban-preview-stage-heading">
            <div>
              <span className="urban-preview-live-dot" />
              LIVE PREVIEW
            </div>

            <span>URBAN CRAVE / 03</span>
          </div>

          <UrbanCraveTemplate
            offer={previewOffer}
            preview
          />

          <div className="urban-preview-stage-footer">
            <span>Changes appear instantly</span>
            <span>Designed for bold food offers</span>
          </div>
        </div>

        <aside className="urban-preview-controls">
          <div className="urban-preview-controls-heading">
            <span>01 / CONTENT</span>
            <h2>Make it yours</h2>
          </div>

          <label className="urban-preview-field">
            <span>Offer headline</span>
            <input
              type="text"
              maxLength={55}
              value={offer.title}
              onChange={(event) =>
                updateOffer("title", event.target.value)
              }
              placeholder="THE CRAVE EVENT"
            />
          </label>

          <label className="urban-preview-field">
            <span>Restaurant name</span>
            <input
              type="text"
              maxLength={45}
              value={offer.shop_name}
              onChange={(event) =>
                updateOffer("shop_name", event.target.value)
              }
              placeholder="Your restaurant"
            />
          </label>

          <label className="urban-preview-field">
            <span>Offer description</span>
            <textarea
              value={offer.description}
              maxLength={180}
              rows={3}
              onChange={(event) =>
                updateOffer("description", event.target.value)
              }
              placeholder="Describe your offer"
            />
          </label>

          <label className="urban-preview-field">
            <span>Discount percentage</span>

            <div className="urban-preview-number-field">
              <input
                type="number"
                min={0}
                max={100}
                value={offer.discount_percentage}
                onChange={(event) => {
                  const value = event.target.value;

                  updateOffer(
                    "discount_percentage",
                    value === ""
                      ? ""
                      : Math.min(100, Math.max(0, Number(value)))
                  );
                }}
              />

              <span>% OFF</span>
            </div>
          </label>

          <div className="urban-preview-divider" />

          <div className="urban-preview-section-title">
            <span>02 / FOOD PHOTOGRAPHY</span>
            <h3>Choose your hero image</h3>
          </div>

          <div className="urban-preview-upload">
            <div className="urban-preview-upload-icon">↗</div>

            <div className="urban-preview-upload-info">
              <strong>{imageName || "Upload food image"}</strong>
              <span>JPG, PNG, WEBP · Maximum 8 MB</span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </div>

          {imageError && (
            <p className="urban-preview-error" role="alert">
              {imageError}
            </p>
          )}

          {imageUrl && (
            <button
              type="button"
              className="urban-preview-remove-image"
              onClick={removeImage}
            >
              Remove image
            </button>
          )}

          {imageUrl && (
            <div className="urban-preview-image-position">
              <div className="urban-preview-section-title">
                <h3>Image positioning and zoom</h3>
              </div>

              <label>
                <span>Horizontal</span>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.image_position_x}
                  onChange={(event) =>
                    updateSetting(
                      "image_position_x",
                      Number(event.target.value)
                    )
                  }
                />

                <output>{settings.image_position_x}%</output>
              </label>

              <label>
                <span>Vertical</span>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.image_position_y}
                  onChange={(event) =>
                    updateSetting(
                      "image_position_y",
                      Number(event.target.value)
                    )
                  }
                />

                <output>{settings.image_position_y}%</output>
              </label>

              <label>
                <span>Zoom</span>

                <label>
  <span>Image zoom</span>

  <input
    type="range"
    min="25"
    max="250"
    step="5"
    value={settings.image_zoom}
    onChange={(event) =>
      updateSetting(
        "image_zoom",
        Number(event.target.value)
      )
    }
  />

  <output>{settings.image_zoom}%</output>
</label>

                <output>{settings.image_zoom}%</output>
              </label>
            </div>
          )}

          <div className="urban-preview-divider" />

          <div className="urban-preview-section-title">
            <span>03 / COLOUR IDENTITY</span>
            <h3>Automatic image colours</h3>
          </div>

          <p className="urban-preview-colour-help">
            Use the uploaded food image to generate a dark
            background and a complementary accent colour.
          </p>

          <label className="urban-preview-auto-toggle">
            <input
              type="checkbox"
              checked={settings.auto_background}
              onChange={(event) =>
                updateSetting(
                  "auto_background",
                  event.target.checked
                )
              }
            />

            <span>Automatically match background</span>
          </label>

          <label className="urban-preview-auto-toggle">
            <input
              type="checkbox"
              checked={settings.auto_accent}
              onChange={(event) =>
                updateSetting(
                  "auto_accent",
                  event.target.checked
                )
              }
            />

            <span>Automatically match accent colour</span>
          </label>

          <p className="urban-preview-colour-status" aria-live="polite">
            {colorStatus}
          </p>

          <div className="urban-preview-current-colours">
            <div>
              <span>Current background</span>
              <strong>{effectiveBackground}</strong>
              <i style={{ backgroundColor: effectiveBackground }} />
            </div>

            <div>
              <span>Current accent</span>
              <strong>{effectiveAccent}</strong>
              <i style={{ backgroundColor: effectiveAccent }} />
            </div>
          </div>

          <div className="urban-preview-section-title">
            <h3>Colour palettes</h3>
          </div>

          <div className="urban-preview-palettes">
            {PALETTES.map((palette) => (
              <button
                key={palette.name}
                type="button"
                className="urban-preview-palette"
                onClick={() => applyPalette(palette)}
                aria-label={palette.name}
                title={palette.name}
              >
                <span style={{ backgroundColor: palette.background }} />
                <span style={{ backgroundColor: palette.accent }} />
              </button>
            ))}
          </div>

          <div className="urban-preview-color-pickers">
            <label>
              <span>Manual accent</span>

              <input
                type="color"
                value={settings.accent_color}
                onChange={(event) => {
                  updateSetting("accent_color", event.target.value);
                  updateSetting("auto_accent", false);
                }}
              />
            </label>

            <label>
              <span>Manual background</span>

              <input
                type="color"
                value={settings.background_color}
                onChange={(event) => {
                  updateSetting(
                    "background_color",
                    event.target.value
                  );

                  updateSetting("auto_background", false);
                }}
              />
            </label>
          </div>

          <div className="urban-preview-divider" />

          <div className="urban-preview-section-title">
            <span>04 / DESIGN DETAILS</span>
            <h3>Fine-tune the campaign</h3>
          </div>

          <label className="urban-preview-field">
            <span>Offer badge</span>

            <input
              type="text"
              maxLength={30}
              value={settings.badge_text}
              onChange={(event) =>
                updateSetting("badge_text", event.target.value)
              }
            />
          </label>

          <label className="urban-preview-range">
            <span>
              Headline size
              <output>{settings.title_size}px</output>
            </span>

            <input
              type="range"
              min="32"
              max="76"
              value={settings.title_size}
              onChange={(event) =>
                updateSetting(
                  "title_size",
                  Number(event.target.value)
                )
              }
            />
          </label>

          <div className="urban-preview-align">
            <span>Text alignment</span>

            <div>
              {["left", "center", "right"].map((alignment) => (
                <button
                  key={alignment}
                  type="button"
                  className={
                    settings.text_alignment === alignment
                      ? "urban-preview-align--active"
                      : ""
                  }
                  onClick={() =>
                    updateSetting("text_alignment", alignment)
                  }
                >
                  {alignment[0].toUpperCase() + alignment.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default UrbanCravePreview;