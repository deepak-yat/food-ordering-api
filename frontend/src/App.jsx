import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ShopRegister from "./pages/ShopRegister";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
function App() {

    return (
        <BrowserRouter>

            <AuthProvider>

                <Routes>

                    <Route
                        path="/"
                        element={<Home />}
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />
                    <Route
                        path="/register/shop"
                        element={<ShopRegister />}
                    />
                    <Route
                        path="/customer/dashboard"
                        element={
                      <ProtectedRoute role="customer">
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                    />
                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;