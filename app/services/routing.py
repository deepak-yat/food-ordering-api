import os

import requests
from dotenv import load_dotenv


load_dotenv()

GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")

if not GRAPHHOPPER_API_KEY:
    raise RuntimeError(
        "GRAPHHOPPER_API_KEY not configured"
    )


def calculate_delivery_distance(
    shop_latitude: float,
    shop_longitude: float,
    customer_latitude: float,
    customer_longitude: float
) -> float:

    url = "https://graphhopper.com/api/1/route"

    params = {
        "point": [
            f"{shop_latitude},{shop_longitude}",
            f"{customer_latitude},{customer_longitude}"
        ],
        "profile": "bike",
        "calc_points": "false",
        "key": GRAPHHOPPER_API_KEY
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    paths = data.get("paths", [])

    if not paths:
        raise ValueError(
            "Unable to calculate delivery distance"
        )

    distance_meters = paths[0]["distance"]

    distance_km = distance_meters / 1000

    return distance_km