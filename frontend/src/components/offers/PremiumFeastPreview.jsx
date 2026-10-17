import { useEffect, useRef, useState } from "react";
import PremiumFeastTemplate from "./PremiumFeastTemplate";
import "../../styles/PremiumFeastPreview.css";

const DEFAULTS = {
    accentColor: "#D4AF37",
    badgeText: "EXCLUSIVE OFFER",
    animationEnabled: true,
    backgroundColor: "#100F0B",
    titleSize: 40,
    imagePositionX: 50,
    imagePositionY: 50,
    textAlignment: "left",
    imageBlend: true,
};

const PALETTES = [
    "#D4AF37",
    "#FF69B4",
    "#FF4500",
    "#4CAF50",
    "#65A8FF",
    "#FFFFFF",
];

function PremiumFeastPreview() {
    const [settings, setSettings] = useState({ ...DEFAULTS });
    const [imageUrl, setImageUrl] = useState(null);
    const [imageName, setImageName] = useState("");
    const [autoColors, setAutoColors] = useState(true);

    const fileInputRef = useRef(null);
    const currentObjectUrl = useRef(null);

    useEffect(() => {
        return () => {
            if (currentObjectUrl.current) {
                URL.revokeObjectURL(currentObjectUrl.current);
            }
        };
    }, []);

    const updateSetting = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            event.target.value = "";
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            alert("Please select an image smaller than 8 MB.");
            event.target.value = "";
            return;
        }

        if (currentObjectUrl.current) {
            URL.revokeObjectURL(currentObjectUrl.current);
        }

        const objectUrl = URL.createObjectURL(file);

        currentObjectUrl.current = objectUrl;

        setImageUrl(objectUrl);
        setImageName(file.name);
    };

    const removeImage = () => {
        if (currentObjectUrl.current) {
            URL.revokeObjectURL(currentObjectUrl.current);
            currentObjectUrl.current = null;
        }

        setImageUrl(null);
        setImageName("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const resetSettings = () => {
        removeImage();
        setSettings({ ...DEFAULTS });
        setAutoColors(true);
    };

    const offer = {
        offer_id: 999,
        shop_id: 3,
        shop_name: "AL-AMEEN MANDI",
        title: "Royal Mandi Feast",
        description:
            "Experience authentic flavours and a feast worth remembering.",
        discount_type: "PERCENTAGE",
        discount_value: 25,
        start_at: "2026-10-17T10:00:00+05:30",
        end_at: "2026-10-25T23:59:00+05:30",
        image_url: imageUrl,
        items: [
            {
                item_id: 1,
                item_name: "Chicken Kuzhimandi",
                item_price: 350,
            },
        ],
        template_id: "premium_feast",
        design_config: {
            accent_color: settings.accentColor,
            badge_text: settings.badgeText,
            animation_enabled: settings.animationEnabled,
            background_color: settings.backgroundColor,
            title_size: settings.titleSize,
            image_position_x: settings.imagePositionX,
            image_position_y: settings.imagePositionY,
            text_alignment: settings.textAlignment,
            image_blend: settings.imageBlend,
            auto_colors: autoColors,
        },
    };

    return (
        <main className="premium-preview-page">
            <header className="premium-preview-header">
                <span className="premium-preview-eyebrow">
                    FOODLY DESIGN STUDIO
                </span>

                <h1>Premium Feast</h1>

                <p>
                    Customize your offer and see every change instantly.
                </p>
            </header>

            {/* TOP ROW: LIVE PREVIEW + PRIMARY CUSTOMIZATION */}
            <section className="premium-preview-layout">
                <div className="premium-preview-showcase">
                    <div className="premium-preview-section-heading">
                        <div>
                            <span className="premium-preview-label">
                                LIVE PREVIEW
                            </span>

                            <h2>Your offer design</h2>
                        </div>

                        <span className="premium-preview-status">
                            Live
                        </span>
                    </div>

                    <PremiumFeastTemplate offer={offer} preview />

                    <p className="premium-preview-note">
                        Preview only. Changes are not saved to a Foodly offer.
                    </p>
                </div>

                <aside className="premium-preview-controls">
                    <div className="premium-preview-controls-heading">
                        <div>
                            <span className="premium-preview-label">
                                CUSTOMIZATION
                            </span>

                            <h2>Make it yours</h2>
                        </div>

                        <button
                            type="button"
                            onClick={resetSettings}
                            className="premium-preview-reset"
                        >
                            Reset
                        </button>
                    </div>

                    {/* FOOD IMAGE */}
                    <section className="premium-preview-group">
                        <h3>Food image</h3>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            hidden
                            id="premium-image-upload"
                        />

                        <label
                            htmlFor="premium-image-upload"
                            className="premium-preview-upload"
                        >
                            <span aria-hidden="true">＋</span>

                            <strong>
                                {imageUrl
                                    ? "Change image"
                                    : "Upload food image"}
                            </strong>

                            <small>JPG, PNG, WebP · Maximum 8 MB</small>
                        </label>

                        {imageName && (
                            <div className="premium-preview-image-file">
                                <span title={imageName}>{imageName}</span>

                                <button
                                    type="button"
                                    onClick={removeImage}
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        <label className="premium-preview-check">
                            <input
                                type="checkbox"
                                checked={autoColors}
                                onChange={(event) =>
                                    setAutoColors(event.target.checked)
                                }
                            />

                            Automatically match image colors
                        </label>

                        <p className="premium-preview-help">
                            The preview can extract an average color from
                            your uploaded image.
                        </p>
                    </section>

                    {/* COLORS */}
                    <section className="premium-preview-group">
                        <h3>Colors</h3>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-accent">
                                Accent color
                            </label>

                            <div className="premium-preview-color-row">
                                <input
                                    id="premium-accent"
                                    type="color"
                                    value={settings.accentColor}
                                    onChange={(event) =>
                                        updateSetting(
                                            "accentColor",
                                            event.target.value
                                        )
                                    }
                                />

                                <span>
                                    {settings.accentColor.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-background">
                                Background color
                            </label>

                            <div className="premium-preview-color-row">
                                <input
                                    id="premium-background"
                                    type="color"
                                    value={settings.backgroundColor}
                                    onChange={(event) =>
                                        updateSetting(
                                            "backgroundColor",
                                            event.target.value
                                        )
                                    }
                                />

                                <span>
                                    {settings.backgroundColor.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="premium-preview-palette">
                            <span>Quick palettes</span>

                            <div className="premium-preview-swatches">
                                {PALETTES.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        aria-label={`Use ${color} accent`}
                                        title={color}
                                        style={{ backgroundColor: color }}
                                        onClick={() =>
                                            updateSetting("accentColor", color)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* PROMOTIONAL BADGE */}
                    <section className="premium-preview-group">
                        <h3>Offer badge</h3>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-badge">
                                Promotional text
                            </label>

                            <input
                                id="premium-badge"
                                type="text"
                                maxLength={24}
                                value={settings.badgeText}
                                onChange={(event) =>
                                    updateSetting(
                                        "badgeText",
                                        event.target.value
                                    )
                                }
                                placeholder="EXCLUSIVE OFFER"
                            />

                            <small>Up to 24 characters</small>
                        </div>
                    </section>
                </aside>
            </section>

            {/* BOTTOM ROW: ADDITIONAL CUSTOMIZATION */}
            <section className="premium-preview-additional">
                <div className="premium-preview-additional-heading">
                    <div>
                        <span className="premium-preview-label">
                            FINE-TUNE YOUR DESIGN
                        </span>

                        <h2>Additional customization</h2>

                        <p>
                            Adjust the image, typography, and visual effects
                            without leaving the preview.
                        </p>
                    </div>
                </div>

                <div className="premium-preview-additional-grid">
                    {/* IMAGE POSITIONING */}
                    <section className="premium-preview-group">
                        <h3>Image positioning</h3>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-image-x">
                                Horizontal position: {settings.imagePositionX}%
                            </label>

                            <input
                                id="premium-image-x"
                                className="premium-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.imagePositionX}
                                onChange={(event) =>
                                    updateSetting(
                                        "imagePositionX",
                                        Number(event.target.value)
                                    )
                                }
                                disabled={!imageUrl}
                            />
                        </div>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-image-y">
                                Vertical position: {settings.imagePositionY}%
                            </label>

                            <input
                                id="premium-image-y"
                                className="premium-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.imagePositionY}
                                onChange={(event) =>
                                    updateSetting(
                                        "imagePositionY",
                                        Number(event.target.value)
                                    )
                                }
                                disabled={!imageUrl}
                            />
                        </div>

                        {!imageUrl && (
                            <p className="premium-preview-help">
                                Upload an image to adjust its position.
                            </p>
                        )}
                    </section>

                    {/* TYPOGRAPHY */}
                    <section className="premium-preview-group">
                        <h3>Typography</h3>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-title-size">
                                Title size: {settings.titleSize}px
                            </label>

                            <input
                                id="premium-title-size"
                                className="premium-preview-range"
                                type="range"
                                min="24"
                                max="56"
                                step="2"
                                value={settings.titleSize}
                                onChange={(event) =>
                                    updateSetting(
                                        "titleSize",
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>

                        <div className="premium-preview-control">
                            <label htmlFor="premium-alignment">
                                Text alignment
                            </label>

                            <select
                                id="premium-alignment"
                                value={settings.textAlignment}
                                onChange={(event) =>
                                    updateSetting(
                                        "textAlignment",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </div>
                    </section>

                    {/* IMAGE EFFECTS */}
                    <section className="premium-preview-group">
                        <h3>Image effects</h3>

                        <label className="premium-preview-check">
                            <input
                                type="checkbox"
                                checked={settings.imageBlend}
                                onChange={(event) =>
                                    updateSetting(
                                        "imageBlend",
                                        event.target.checked
                                    )
                                }
                            />

                            Blend image into background
                        </label>

                        <p className="premium-preview-help">
                            Creates a smoother transition between the food
                            image and the background.
                        </p>
                    </section>

                    {/* ANIMATION */}
                    <section className="premium-preview-group">
                        <h3>Motion</h3>

                        <label className="premium-preview-toggle">
                            <span>
                                <strong>Entrance animations</strong>

                                <small>
                                    Smooth motion and transitions
                                </small>
                            </span>

                            <input
                                type="checkbox"
                                checked={settings.animationEnabled}
                                onChange={(event) =>
                                    updateSetting(
                                        "animationEnabled",
                                        event.target.checked
                                    )
                                }
                            />
                        </label>
                    </section>
                </div>
            </section>
        </main>
    );
}

export default PremiumFeastPreview;