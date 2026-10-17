import { useEffect, useRef, useState } from "react";
import SweetPlayfulTemplate from "./SweetPlayfulTemplate";
import "../../styles/SweetPlayfulPreview.css";

const DEFAULTS = {
    accentColor: "#FF7B8A",
    backgroundColor: "#FFF3EB",
    badgeText: "SWEET DEALS",
    titleSize: 40,
    textAlignment: "center",
    imageBlend: true,
    animationEnabled: true,
    leftImagePositionX: 50,
    leftImagePositionY: 50,
    rightImagePositionX: 50,
    rightImagePositionY: 50,
};

const PALETTES = [
    "#FF7B8A",
    "#FF9F68",
    "#B39AF5",
    "#66CDAA",
    "#65A8FF",
    "#F4B942",
];

function SweetPlayfulPreview() {
    const [settings, setSettings] = useState({ ...DEFAULTS });

    const [leftImageUrl, setLeftImageUrl] = useState(null);
    const [rightImageUrl, setRightImageUrl] = useState(null);

    const [leftImageName, setLeftImageName] = useState("");
    const [rightImageName, setRightImageName] = useState("");

    const leftInputRef = useRef(null);
    const rightInputRef = useRef(null);

    const leftObjectUrl = useRef(null);
    const rightObjectUrl = useRef(null);

    useEffect(() => {
        return () => {
            if (leftObjectUrl.current) {
                URL.revokeObjectURL(leftObjectUrl.current);
            }

            if (rightObjectUrl.current) {
                URL.revokeObjectURL(rightObjectUrl.current);
            }
        };
    }, []);

    const updateSetting = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const handleImageUpload = (event, side) => {
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

        const objectRef =
            side === "left" ? leftObjectUrl : rightObjectUrl;

        if (objectRef.current) {
            URL.revokeObjectURL(objectRef.current);
        }

        const objectUrl = URL.createObjectURL(file);

        objectRef.current = objectUrl;

        if (side === "left") {
            setLeftImageUrl(objectUrl);
            setLeftImageName(file.name);
        } else {
            setRightImageUrl(objectUrl);
            setRightImageName(file.name);
        }
    };

    const removeImage = (side) => {
        const objectRef =
            side === "left" ? leftObjectUrl : rightObjectUrl;

        const inputRef =
            side === "left" ? leftInputRef : rightInputRef;

        if (objectRef.current) {
            URL.revokeObjectURL(objectRef.current);
            objectRef.current = null;
        }

        if (side === "left") {
            setLeftImageUrl(null);
            setLeftImageName("");
        } else {
            setRightImageUrl(null);
            setRightImageName("");
        }

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const resetSettings = () => {
        removeImage("left");
        removeImage("right");
        setSettings({ ...DEFAULTS });
    };

    const offer = {
        offer_id: 1000,
        shop_id: 3,
        shop_name: "AL-AMEEN MANDI",
        title: "Royal Mandi Feast",
        description:
            "Experience authentic flavours and a feast worth remembering.",
        discount_type: "PERCENTAGE",
        discount_value: 25,
        image_url: null,
        left_image_url: leftImageUrl,
        right_image_url: rightImageUrl,
        items: [
            {
                item_id: 1,
                item_name: "Chicken Kuzhimandi",
                item_price: 350,
            },
        ],
        template_id: "sweet_playful",
        design_config: {
            accent_color: settings.accentColor,
            background_color: settings.backgroundColor,
            badge_text: settings.badgeText,
            title_size: settings.titleSize,
            text_alignment: settings.textAlignment,
            image_blend: settings.imageBlend,
            animation_enabled: settings.animationEnabled,

            left_image_url: leftImageUrl,
            right_image_url: rightImageUrl,

            image_position_x: settings.leftImagePositionX,
            image_position_y: settings.leftImagePositionY,

            right_image_position_x: settings.rightImagePositionX,
            right_image_position_y: settings.rightImagePositionY,
        },
    };

    return (
        <main className="sweet-preview-page">
            <header className="sweet-preview-header">
                <span className="sweet-preview-eyebrow">
                    FOODLY DESIGN STUDIO
                </span>

                <h1>Sweet &amp; Playful</h1>

                <p>
                    Two food images, playful colors, and a vibrant offer
                    design.
                </p>
            </header>

            {/* TOP ROW */}
            <section className="sweet-preview-layout">
                <div className="sweet-preview-showcase">
                    <div className="sweet-preview-section-heading">
                        <div>
                            <span className="sweet-preview-label">
                                LIVE PREVIEW
                            </span>

                            <h2>Your offer design</h2>
                        </div>

                        <span className="sweet-preview-status">Live</span>
                    </div>

                    <SweetPlayfulTemplate offer={offer} preview />

                    <p className="sweet-preview-note">
                        Preview only. Changes are not saved to a Foodly offer.
                    </p>
                </div>

                {/* PRIMARY CUSTOMIZATION */}
                <aside className="sweet-preview-controls">
                    <div className="sweet-preview-controls-heading">
                        <div>
                            <span className="sweet-preview-label">
                                CUSTOMIZATION
                            </span>

                            <h2>Make it yours</h2>
                        </div>

                        <button
                            type="button"
                            className="sweet-preview-reset"
                            onClick={resetSettings}
                        >
                            Reset
                        </button>
                    </div>

                    {/* LEFT IMAGE */}
                    <section className="sweet-preview-group">
                        <h3>Left food image</h3>

                        <input
                            ref={leftInputRef}
                            id="sweet-left-image"
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) =>
                                handleImageUpload(event, "left")
                            }
                        />

                        <label
                            htmlFor="sweet-left-image"
                            className="sweet-preview-upload"
                        >
                            <span aria-hidden="true">＋</span>

                            <strong>
                                {leftImageUrl
                                    ? "Change left image"
                                    : "Upload left image"}
                            </strong>

                            <small>JPG, PNG, WebP · Maximum 8 MB</small>
                        </label>

                        {leftImageName && (
                            <div className="sweet-preview-image-file">
                                <span title={leftImageName}>
                                    {leftImageName}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeImage("left")}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </section>

                    {/* RIGHT IMAGE */}
                    <section className="sweet-preview-group">
                        <h3>Right food image</h3>

                        <input
                            ref={rightInputRef}
                            id="sweet-right-image"
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) =>
                                handleImageUpload(event, "right")
                            }
                        />

                        <label
                            htmlFor="sweet-right-image"
                            className="sweet-preview-upload"
                        >
                            <span aria-hidden="true">＋</span>

                            <strong>
                                {rightImageUrl
                                    ? "Change right image"
                                    : "Upload right image"}
                            </strong>

                            <small>JPG, PNG, WebP · Maximum 8 MB</small>
                        </label>

                        {rightImageName && (
                            <div className="sweet-preview-image-file">
                                <span title={rightImageName}>
                                    {rightImageName}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeImage("right")}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </section>

                    {/* COLORS */}
                    <section className="sweet-preview-group">
                        <h3>Colors</h3>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-accent">
                                Accent color
                            </label>

                            <div className="sweet-preview-color-row">
                                <input
                                    id="sweet-accent"
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

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-background">
                                Background color
                            </label>

                            <div className="sweet-preview-color-row">
                                <input
                                    id="sweet-background"
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

                        <div className="sweet-preview-palette">
                            <span>Quick palettes</span>

                            <div className="sweet-preview-swatches">
                                {PALETTES.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        title={color}
                                        aria-label={`Use ${color} accent`}
                                        style={{ backgroundColor: color }}
                                        onClick={() =>
                                            updateSetting(
                                                "accentColor",
                                                color
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* BADGE */}
                    <section className="sweet-preview-group">
                        <h3>Promotional badge</h3>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-badge">
                                Badge text
                            </label>

                            <input
                                id="sweet-badge"
                                type="text"
                                maxLength={24}
                                value={settings.badgeText}
                                onChange={(event) =>
                                    updateSetting(
                                        "badgeText",
                                        event.target.value
                                    )
                                }
                                placeholder="SWEET DEALS"
                            />

                            <small>Up to 24 characters</small>
                        </div>
                    </section>
                </aside>
            </section>

            {/* BOTTOM ROW */}
            <section className="sweet-preview-additional">
                <div className="sweet-preview-additional-heading">
                    <span className="sweet-preview-label">
                        FINE-TUNE YOUR DESIGN
                    </span>

                    <h2>Additional customization</h2>

                    <p>
                        Control each image independently and fine-tune
                        typography and effects.
                    </p>
                </div>

                <div className="sweet-preview-additional-grid">
                    {/* LEFT IMAGE POSITION */}
                    <section className="sweet-preview-group">
                        <h3>Left image positioning</h3>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-left-x">
                                Horizontal: {settings.leftImagePositionX}%
                            </label>

                            <input
                                id="sweet-left-x"
                                className="sweet-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.leftImagePositionX}
                                disabled={!leftImageUrl}
                                onChange={(event) =>
                                    updateSetting(
                                        "leftImagePositionX",
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-left-y">
                                Vertical: {settings.leftImagePositionY}%
                            </label>

                            <input
                                id="sweet-left-y"
                                className="sweet-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.leftImagePositionY}
                                disabled={!leftImageUrl}
                                onChange={(event) =>
                                    updateSetting(
                                        "leftImagePositionY",
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>
                    </section>

                    {/* RIGHT IMAGE POSITION */}
                    <section className="sweet-preview-group">
                        <h3>Right image positioning</h3>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-right-x">
                                Horizontal: {settings.rightImagePositionX}%
                            </label>

                            <input
                                id="sweet-right-x"
                                className="sweet-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.rightImagePositionX}
                                disabled={!rightImageUrl}
                                onChange={(event) =>
                                    updateSetting(
                                        "rightImagePositionX",
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-right-y">
                                Vertical: {settings.rightImagePositionY}%
                            </label>

                            <input
                                id="sweet-right-y"
                                className="sweet-preview-range"
                                type="range"
                                min="0"
                                max="100"
                                value={settings.rightImagePositionY}
                                disabled={!rightImageUrl}
                                onChange={(event) =>
                                    updateSetting(
                                        "rightImagePositionY",
                                        Number(event.target.value)
                                    )
                                }
                            />
                        </div>
                    </section>

                    {/* TYPOGRAPHY */}
                    <section className="sweet-preview-group">
                        <h3>Typography</h3>

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-title-size">
                                Title size: {settings.titleSize}px
                            </label>

                            <input
                                id="sweet-title-size"
                                className="sweet-preview-range"
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

                        <div className="sweet-preview-control">
                            <label htmlFor="sweet-alignment">
                                Text alignment
                            </label>

                            <select
                                id="sweet-alignment"
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

                    {/* EFFECTS */}
                    <section className="sweet-preview-group">
                        <h3>Image effects</h3>

                        <label className="sweet-preview-check">
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

                            Blend images into background
                        </label>

                        <p className="sweet-preview-help">
                            Fade both images into the central content.
                        </p>

                        <label className="sweet-preview-toggle">
                            <span>
                                <strong>Entrance animations</strong>

                                <small>
                                    Floating shapes and gentle motion
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

export default SweetPlayfulPreview;