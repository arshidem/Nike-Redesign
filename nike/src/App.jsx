import React,{useState,useEffect} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import Home from "./features/user/pages/Home";
import { LogoLoader } from "./features/user/components/LogoLoader";
import CategoryPage from "./features/user/pages/ModelPage";
import ProductDetails from "./features/user/pages/ProductDetails";
import SignIn from "./features/auth/pages/SignIn";
import Register from "./features/auth/pages/CompleteRegister";
import VerifySignInOtp from "./features/auth/pages/VerifyOtp";
import VerifyRegisterOtp from "./features/auth/pages/VerifyRegisterOtp";
import ModelPage from "./features/user/pages/ModelPage";
import Cart from "./features/user/pages/Cart";


import { AdminRoute } from "./features/admin/routes/AdminRoute";
import { useAppContext } from "./context/AppContext";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import CreateProduct from "./features/admin/pages/CreateProduct";
import UpdateProduct from "./features/admin/pages/UpdateProduct";
import AdminProductDetails from "./features/admin/pages/AdminProductDetailes";
import { AdminUserDetails } from "./features/admin/pages/AdminUserDetails";
import VerifyOtp from "./features/auth/pages/VerifyOtp";
import CompleteRegister from "./features/auth/pages/CompleteRegister";
import Profile from "./features/user/pages/Profile";
import AccountSettings from "./features/user/AccountSettings/AccountSettings";
import Checkout from "./features/user/pages/Checkout";
import Order from "./features/user/pages/Order";
import OrderDetails from "./features/user/pages/OrderDetails";

import ProductListPage from "./features/user/pages/ProductListPage";
import toast, { Toaster } from "react-hot-toast";
const publicVapidKey = import.meta.env.VAPID_PUBLIC_KEY

function App() {
  const { user, isAuthenticated,backendUrl } = useAppContext();
  console.log(backendUrl);


   useEffect(() => {
    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator)) {
        console.warn("Service Worker not supported");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        // Send subscription to backend
        await fetch("/api/subscribe", {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("📩 User subscribed to push notifications");
      } catch (error) {
        console.error("❌ Failed to subscribe user:", error);
      }
    };

    function urlBase64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    }

    subscribeUser();
  }, []);
  useEffect(() => {
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("✅ Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.error("❌ Service Worker registration failed:", err);
      });
  });
}

}, []);

 useEffect(() => {
  if (!user || user.role !== "admin") {
    console.log("🛑 Not an admin or user not logged in");
    return;
  }

  console.log("✅ Admin detected, initializing socket...");
  const socket = io(backendUrl); // Replace with your backend URL

  socket.on("connect", () => {
    console.log("🔌 Connected to Socket.IO server with ID:", socket.id);

    // Identify this socket as admin
    socket.emit("identify", { role: "admin", email: user.email });
    console.log("📨 Sent 'identify' event as admin:", user.email);
  });

  // Ask for notification permission
  if (Notification.permission !== "granted") {
    console.log("🔔 Requesting notification permission...");
    Notification.requestPermission().then((permission) => {
      console.log("📝 Notification permission result:", permission);
    });
  } else {
    console.log("✅ Notification permission already granted");
  }

  // Listen for new order events
 socket.on("new-order", (orderData) => {
  console.log("📦 New Order Received from server:", orderData);

  if (Notification.permission === "granted") {
    const notification = new Notification("🛒 New Order Received", {
      body: `From: ${orderData.user.email}\nTotal: ₹${orderData.totalPrice}`,
      icon: "/logo192.png",
      vibrate: [200, 100, 200], // Note: This only works with Push API, not here
    });

    // Trigger manual vibration (Android only)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]); // vibrate-pause-vibrate
      console.log("📳 Vibrating device");
    }

    console.log("🔔 Notification shown");
  } else {
    console.warn("🚫 Notification permission not granted");
  }

  // Fallback toast
  toast.success(`New order from ${orderData.user.email}`);
});


  socket.on("disconnect", () => {
    console.warn("❌ Disconnected from socket server");
  });

  socket.on("connect_error", (err) => {
    console.error("❗Socket connection error:", err.message);
  });

  return () => {
    console.log("🔌 Cleaning up socket connection");
    socket.disconnect();
  };
}, [user]);

  return (
    <> 
     <Toaster position="top-right" />
     <AppRoutes user={user} isAuthenticated={isAuthenticated} />
       </>
  );
  
    
}

function AppRoutes({ user, isAuthenticated }) {
  return (
    <Routes>
      {/* Logo animation shows on initial load at "/" */}
      <Route path="/" element={<LogoLoader />} />
      
      {/* Home page is now at /home */}
      <Route path="/home" element={<Home />} />

      {/* Other public routes */}
      <Route path="model/:modelName" element={<ModelPage />} />
      <Route path="/product/:productSlug" element={<ProductDetails />} />
      <Route path="/bag" element={<Cart />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/orders/:orderId" element={<OrderDetails />} />
      {/* Menus */}

{/* New & Featured */}
<Route path="/new/arrivals" element={<ProductListPage title="New Arrivals" />} />
<Route path="/new/best-sellers" element={<ProductListPage title="Best Sellers" />} />
<Route path="/new/trending" element={<ProductListPage title="Trending" />} />

{/* Men */}
<Route path="/men/arrivals" element={<ProductListPage title="Men - New Arrivals" />} />
<Route path="/men/best-sellers" element={<ProductListPage title="Men - Best Sellers" />} />
<Route path="/men/shoes" element={<ProductListPage title="Men - Shoes" />} />
<Route path="/men/clothing" element={<ProductListPage title="Men - Clothing" />} />

{/* Women */}
<Route path="/women/arrivals" element={<ProductListPage title="Women - New Arrivals" />} />
<Route path="/women/best-sellers" element={<ProductListPage title="Women - Best Sellers" />} />
<Route path="/women/shoes" element={<ProductListPage title="Women - Shoes" />} />
<Route path="/women/clothing" element={<ProductListPage title="Women - Clothing" />} />

{/* Kids */}
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

      {/* Admin protected route */}
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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
