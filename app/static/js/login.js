const form = document.getElementById("login-form");
const message = document.getElementById("login-message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const payload = {
        user_name: formData.get("user_name"),
        password: formData.get("password")
    };

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.detail || "Login failed.";
            return;
        }

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        const params = new URLSearchParams(
            window.location.search
        );

        const next = params.get("next") || "/";

        window.location.href = next;

    } catch (error) {
        message.textContent =
            "Unable to connect to the server.";

        console.error(error);
    }
});