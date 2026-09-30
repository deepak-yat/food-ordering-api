import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadGoogleIdentity } from "../utils/loadGoogleIdentity";
import { completeGoogleSignIn } from "../utils/completeGoogleSignIn";
import { useAuth } from "../context/AuthContext";
function GoogleSignInButton() {
    const buttonRef = useRef(null);
    const navigate = useNavigate();
const { loadUser } = useAuth();
    useEffect(() => {
        let cancelled = false;

        async function initializeGoogle() {
            try {
                const google = await loadGoogleIdentity();

                if (cancelled || !buttonRef.current) {
                    return;
                }

                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

                if (!clientId) {
                    console.error("VITE_GOOGLE_CLIENT_ID is not configured");
                    return;
                }

                google.accounts.id.initialize({
                    client_id: clientId,
                    callback: async (response) => {
                        try {
                            await completeGoogleSignIn(
    response.credential,
    navigate,
    loadUser
);
                        } catch (error) {
                            console.error(error);
                        }
                    },
                });

                google.accounts.id.renderButton(buttonRef.current, {
                    theme: "filled_black",
                    size: "large",
                    shape: "pill",
                    text: "continue_with",
                    width: 320,
                });
            } catch (error) {
                console.error("Failed to load Google Sign-In:", error);
            }
        }

        initializeGoogle();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return <div ref={buttonRef}></div>;
}

export default GoogleSignInButton;