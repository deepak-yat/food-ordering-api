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
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import ShopDashboard from "./pages/ShopDashboard";
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
                    <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute role="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                    />
                    <Route
                    path="/admin/users"
                    element={
                            <ProtectedRoute role="admin">
                                <AdminUsers />
                            </ProtectedRoute>
                    }
                    />
                    <Route
    path="/shop/dashboard"
    element={
        <ProtectedRoute role="shop_owner">
            <ShopDashboard />
        </ProtectedRoute>
    }
/>
                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;