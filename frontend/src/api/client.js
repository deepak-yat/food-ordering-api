const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiFetch(endpoint, options = {}) {

    const url = `${API_BASE_URL}${endpoint}`;

    console.log("API REQUEST:", url);

    const isFormData =
        options.body instanceof FormData;

    const headers = {
        ...(options.headers || {})
    };

    // Only set JSON content type for normal JSON requests.
    // Let the browser set the multipart boundary for FormData.
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers
    });

    console.log(
        "API RESPONSE:",
        response.status,
        response.url
    );

    const contentType =
        response.headers.get("content-type");

    let data = null;

    if (contentType?.includes("application/json")) {
        data = await response.json();
    }

    if (!response.ok) {
        const detail =
            typeof data?.detail === "string"
                ? data.detail
                : "Request failed";

        const error = new Error(detail);

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}