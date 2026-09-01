import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import { apiFetch } from "../api/client";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [loading, setLoading] =
        useState(true);


    async function loadUser() {

        try {

            const currentUser =
                await apiFetch("/auth/me");

            setUser(currentUser);

            return currentUser;

        } catch (error) {

            if (error.status !== 401) {
                console.error(error);
            }

            setUser(null);

            return null;

        } finally {

            setLoading(false);
        }
    }


    useEffect(() => {
        loadUser();
    }, []);


    async function logout() {

        try {

            await apiFetch(
                "/auth/logout",
                {
                    method: "POST"
                }
            );

        } finally {

            setUser(null);
        }
    }


    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                setUser,
                loadUser,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {

    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}