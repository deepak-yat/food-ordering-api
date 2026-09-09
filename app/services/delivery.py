def calculate_delivery_fee(distance_km : float) -> float:
    if distance_km <= 3:
        return 30.0

    if distance_km <=5:
        return 40.0

    if distance_km <= 8:
        return 60.0

    if distance_km <= 12:
        return 80.0

    raise ValueError(
        "Delivery is not available for locations more than 12 km"
    )