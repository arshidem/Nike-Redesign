import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Search from "./features/user/components/Search";
import Home from "./features/user/pages/Home";
import SignIn from "./features/auth/pages/SignIn";
import VerifyOtp from "./features/auth/pages/VerifyOtp";
import CompleteRegister from "./features/auth/pages/CompleteRegister";
import VerifyRegisterOtp from "./features/auth/pages/VerifyRegisterOtp";
import AccountSettings from "./features/user/AccountSettings/AccountSettings";
import { AdminUserDetails } from "./features/admin/pages/AdminUserDetails";
import { AdminRoute } from "./features/admin/routes/AdminRoute";
import ProductListPage from "./features/user/pages/ProductListPage"
const ModelPage = lazy(() => import("./features/user/pages/ModelPage"));
const ProductDetails = lazy(() => import("./features/user/pages/ProductDetails"));
const Cart = lazy(() => import("./features/user/pages/Cart"));
const Checkout = lazy(() => import("./features/user/pages/Checkout"));
const Profile = lazy(() => import("./features/user/pages/Profile"));
const Order = lazy(() => import("./features/user/pages/Order"));
const OrderDetails = lazy(() => import("./features/user/pages/OrderDetails"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const CreateProduct = lazy(() => import("./features/admin/pages/CreateProduct"));
const UpdateProduct = lazy(() => import("./features/admin/pages/UpdateProduct"));
const AdminProductDetails = lazy(() => import("./features/admin/pages/AdminProductDetailes"));
const Wishlist = lazy(()=> import("./features/user/pages/Wishlist") )
import { LogoLoader } from "./features/user/components/LogoLoader";

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LogoLoader />} />
      <Route path="/home" element={<Home />} />
      <Route path="/model/:modelName" element={<ModelPage />} />
      <Route path="/product/:productSlug" element={<ProductDetails />} />
      <Route path="/bag" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/orders" element={<Order />} />
      <Route path="/orders/:orderId" element={<OrderDetails />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/account" element={<AccountSettings />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/complete-register" element={<CompleteRegister />} />
      <Route path="/verify-register-otp" element={<VerifyRegisterOtp />} />

        <Route path="/search" element={<Search isOpen={true} onClose={() => { window.history.back(); }} />} />

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
      <Route path="/sale/shopAllSale" element={<ProductListPage title="Shop All Sale" />} />
      <Route path="/sale/best-sellers" element={<ProductListPage title="Best Sellers" />} />
      <Route path="/sale/last-chance" element={<ProductListPage title="Last Chance" />} />



      {/* Admin */}
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

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <AppRoutes />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
