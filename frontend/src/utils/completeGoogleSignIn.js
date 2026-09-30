import { apiFetch } from "../api/client";

export async function completeGoogleSignIn(idToken, navigate, loadUser) {
    await apiFetch(
        "/auth/google",
        {
            method: "POST",
            body: JSON.stringify({
                id_token: idToken,
            }),
        }
    );

    const user = await loadUser();

    if (!user) {
        throw new Error(
            "Unable to verify Google login session"
        );
    }

    if (user.role === "customer") {
        navigate("/customer/dashboard");
    } else if (user.role === "shop_owner") {
        navigate("/shop/dashboard");
    } else if (user.role === "admin") {
        navigate("/admin/dashboard");
    } else {
        throw new Error("Unknown user role");
    }
}