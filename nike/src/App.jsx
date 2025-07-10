import React,{useState,useEffect} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
import Footer from "./features/user/components/Footer";
import Order from "./features/user/pages/Order";
import OrderDetails from "./features/user/pages/OrderDetails";


function App() {
  const { user, isAuthenticated } = useAppContext();

  return (
    <> 
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
