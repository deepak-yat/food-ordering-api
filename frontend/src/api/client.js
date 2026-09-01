const API_BASE_URL = "http://127.0.0.1:8000";

export async function apiFetch(endpoint, options = {}) {

    const url = `${API_BASE_URL}${endpoint}`;

    console.log("API REQUEST:", url);

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
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
        const error = new Error(
            data?.detail || "Request failed"
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}