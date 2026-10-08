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

    if (user.role === "CUSTOMER") {
        navigate("/customer/dashboard");
    } else if (user.role === "SHOP_OWNER") {
        navigate("/shop/dashboard");
    } else if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
    } else if (user.role === "KITCHEN_STAFF") {
        navigate("/kitchen/dashboard");
    } else if (user.role === "delivery_partner") {
        navigate("/delivery/dashboard");
    } else {
        throw new Error("Unknown user role");
    }
}