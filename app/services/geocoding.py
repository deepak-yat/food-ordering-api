import os

import requests
from dotenv import load_dotenv

load_dotenv()

GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY")

if not GRAPHHOPPER_API_KEY  :
    raise RuntimeError("GRAPHHOPPER_API_KEY not configured")

def geo_code_address(address : str) -> tuple[float,float]:
    url = "https://graphhopper.com/api/1/geocode"

    params = {
        "q" : address,
        "key" : GRAPHHOPPER_API_KEY,
        "limit" : 1
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    hits = data.get("hits",[])

    if not hits:
        raise ValueError("Unable to find provided address")

    point = hits[0].get("point")

    if not point:
        raise ValueError("Location coordinates were not returned")

    latitude = point["lat"]
    longitude = point["lng"]

    return latitude, longitude

def reverse_geocode(latitude: float, longitude: float) -> dict:
    url = "https://graphhopper.com/api/1/geocode"

    params = {
        "point": f"{latitude},{longitude}",
        "reverse": "true",
        "key": GRAPHHOPPER_API_KEY,
        "limit": 1
    }

    response = requests.get(
        url,
        params=params,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    hits = data.get("hits", [])

    if not hits:
        raise ValueError(
            "Unable to find an address for your current location"
        )

    hit = hits[0]

    return {
        "address_line1": hit.get("name", ""),
        "city": hit.get("city", ""),
        "state": hit.get("state", ""),
        "pincode": hit.get("postcode", ""),
        "country": hit.get("country", "")
    }