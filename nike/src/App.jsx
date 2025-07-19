import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import { useAppContext } from "./context/AppContext";
import toast, { Toaster } from "react-hot-toast";

// Components that should load immediately
import Home from "./features/user/pages/Home";
import { LogoLoader } from "./features/user/components/LogoLoader";
import SignIn from "./features/auth/pages/SignIn";
import VerifyOtp from "./features/auth/pages/VerifyOtp";
import CompleteRegister from "./features/auth/pages/CompleteRegister";
import VerifyRegisterOtp from "./features/auth/pages/VerifyRegisterOtp";
import {AdminUserDetails} from "./features/admin/pages/AdminUserDetails";
import AccountSettings from "./features/user/AccountSettings/AccountSettings"
// Lazy-loaded components
const CategoryPage = lazy(() => import("./features/user/pages/ModelPage"));
const ProductDetails = lazy(() => import("./features/user/pages/ProductDetails"));
const ModelPage = lazy(() => import("./features/user/pages/ModelPage"));
const Cart = lazy(() => import("./features/user/pages/Cart"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const CreateProduct = lazy(() => import("./features/admin/pages/CreateProduct"));
const UpdateProduct = lazy(() => import("./features/admin/pages/UpdateProduct"));
const AdminProductDetails = lazy(() => import("./features/admin/pages/AdminProductDetailes"));
const Profile = lazy(() => import("./features/user/pages/Profile"));
const Checkout = lazy(() => import("./features/user/pages/Checkout"));
const Order = lazy(() => import("./features/user/pages/Order"));
const OrderDetails = lazy(() => import("./features/user/pages/OrderDetails"));
const ProductListPage = lazy(() => import("./features/user/pages/ProductListPage"));

import { AdminRoute } from "./features/admin/routes/AdminRoute";
// Custom loading componenti
const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  const { user, isAuthenticated, backendUrl } = useAppContext();

const socketRef = useRef(null);

useEffect(() => {
  if (!user?.email || user.role !== "admin") return;

  if (socketRef.current) return; // Already connected

  socketRef.current = io(backendUrl, {
    transports: ["websocket"],
  });

  const socket = socketRef.current;

  socket.on("connect", () => {
    console.log("🔌 Connected to Socket.IO server with ID:", socket.id);
    socket.emit("identify", { role: "admin", email: user.email });
  });

  socket.on("new-order", (orderData) => {
    toast.success(`New order from ${orderData.user.email} - ₹${orderData.totalPrice}`);
  });

  socket.on("disconnect", () => {
    console.warn("❌ Disconnected from socket server");
  });

  socket.on("connect_error", (err) => {
    console.error("❗Socket connection error:", err.message);
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [user?.email, backendUrl]);

// ErrorBoundary.jsx (or at the top of App.jsx)
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
  return (
    <> 
       <Toaster position="top-center" />
      <ErrorBoundary> {/* 👈 Add here */}
        <Suspense fallback={<Loading />}>
          <AppRoutes user={user} isAuthenticated={isAuthenticated} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

function AppRoutes({ user, isAuthenticated }) {
  return (
    <Routes>
      <Route path="/" element={<LogoLoader />} />
      <Route path="/home" element={<Home />} />

      {/* Lazy-loaded routes */}
      <Route path="model/:modelName" element={<ModelPage />} />
      <Route path="/product/:productSlug" element={<ProductDetails />} />
      <Route path="/bag" element={<Cart />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/orders/:orderId" element={<OrderDetails />} />

      {/* Product List Pages */}
      <Route path="/new/arrivals" element={<ProductListPage title="New Arrivals" />} />
      <Route path="/new/best-sellers" element={<ProductListPage title="Best Sellers" />} />
      <Route path="/new/trending" element={<ProductListPage title="Trending" />} />
      <Route path="/men/arrivals" element={<ProductListPage title="Men - New Arrivals" />} />
      <Route path="/men/best-sellers" element={<ProductListPage title="Men - Best Sellers" />} />
      <Route path="/men/shoes" element={<ProductListPage title="Men - Shoes" />} />
      <Route path="/men/clothing" element={<ProductListPage title="Men - Clothing" />} />
      <Route path="/women/arrivals" element={<ProductListPage title="Women - New Arrivals" />} />
      <Route path="/women/best-sellers" element={<ProductListPage title="Women - Best Sellers" />} />
      <Route path="/women/shoes" element={<ProductListPage title="Women - Shoes" />} />
      <Route path="/women/clothing" element={<ProductListPage title="Women - Clothing" />} />
      <Route path="/kids/arrivals" element={<ProductListPage title="Kids - New Arrivals" />} />
      <Route path="/kids/best-sellers" element={<ProductListPage title="Kids - Best Sellers" />} />
      <Route path="/kids/shoes" element={<ProductListPage title="Kids - Shoes" />} />
      <Route path="/kids/clothing" element={<ProductListPage title="Kids - Clothing" />} />
      <Route path="/kids/age" element={<ProductListPage title="Shop by Age" />} />

      <Route path="/checkout" element={<Checkout />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/account" element={<AccountSettings />} />

      {/* Auth routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="complete-register" element={<CompleteRegister />} />
      <Route path="/verify-register-otp" element={<VerifyRegisterOtp />} />

      {/* Admin routes */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="/admin/create-product" element={<CreateProduct />} />
      <Route path="/admin/product/:slug" element={<AdminProductDetails />} />
      <Route path="/admin/product/update/:slug" element={<UpdateProduct />} />
      <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
      
 
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;