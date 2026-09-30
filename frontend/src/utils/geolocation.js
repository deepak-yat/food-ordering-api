export function getBrowserCoordinates({
    timeout = 5000,
    maximumAge = 5 * 60 * 1000
} = {}) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) =>
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }),
            () => resolve(null),
            {
                enableHighAccuracy: false,
                timeout,
                maximumAge
            }
        );
    });
}