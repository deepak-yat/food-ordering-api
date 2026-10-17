import re
from typing import Any


# Canonical template IDs used by the frontend.
TEMPLATE_IDS = {
    "premium_feast",
    "sweet_playful",
    "urban_crave",
    "editorial_pop",
    # Retain legacy IDs for previously saved offers.
    "explosive_deals",
    "fresh_minimal",
}

# Map legacy IDs to the current visual templates.
TEMPLATE_ALIASES = {
    "explosive_deals": "urban_crave",
    "fresh_minimal": "editorial_pop",
}

TEMPLATE_CONFIG_RULES = {
    "premium_feast": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
    "sweet_playful": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
    "urban_crave": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
    "editorial_pop": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
    # Preserve validation for existing offers.
    "explosive_deals": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
    "fresh_minimal": {
        "accent_color",
        "badge_text",
        "animation_enabled",
    },
}

HEX_COLOR_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")


def validate_template_config(
    template_id: str,
    design_config: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Validate an offer template and its visual configuration.

    Template settings affect presentation only. They must never
    affect offer eligibility, discount calculations, or pricing.
    """

    if template_id not in TEMPLATE_IDS:
        raise ValueError(
            f"Unsupported template_id: {template_id}"
        )

    if design_config is None:
        return {}

    if not isinstance(design_config, dict):
        raise ValueError(
            "design_config must be a JSON object"
        )

    allowed_keys = TEMPLATE_CONFIG_RULES[template_id]

    unknown_keys = set(design_config.keys()) - allowed_keys

    if unknown_keys:
        raise ValueError(
            "Unsupported design_config setting(s): "
            + ", ".join(sorted(unknown_keys))
        )

    validated_config = dict(design_config)

    if "accent_color" in validated_config:
        accent_color = validated_config["accent_color"]

        if (
            not isinstance(accent_color, str)
            or not HEX_COLOR_PATTERN.fullmatch(accent_color)
        ):
            raise ValueError(
                "accent_color must be a hexadecimal color "
                "such as #D4AF37"
            )

    if "badge_text" in validated_config:
        badge_text = validated_config["badge_text"]

        if not isinstance(badge_text, str):
            raise ValueError(
                "badge_text must be a string"
            )

        badge_text = badge_text.strip()

        if len(badge_text) > 24:
            raise ValueError(
                "badge_text cannot exceed 24 characters"
            )

        validated_config["badge_text"] = badge_text

    if "animation_enabled" in validated_config:
        animation_enabled = validated_config["animation_enabled"]

        if not isinstance(animation_enabled, bool):
            raise ValueError(
                "animation_enabled must be a boolean"
            )

    return validated_config