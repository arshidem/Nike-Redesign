import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import { useAppContext } from "../../../context/AppContext";
import {
  getLocalCart,
  setLocalCart,
  clearLocalCart,
} from "../../../utils/localCart";

const useCartServices = () => {
  const { backendUrl, token } = useAppContext();

  const api = axios.create({
    baseURL: `${backendUrl}/api/cart`,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  // Always attach latest token
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const isAuthenticated = !!token;

  const calculateTotal = (items) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getCart = async () => {
    if (isAuthenticated) {
      const res = await api.get("/");
      return res.data;
    } else {
      const items = getLocalCart();
      return { items, total: calculateTotal(items) };
    }
  };

  const addToCart = async (data) => {
      console.log("Auth?", isAuthenticated, "Token:", token);

    if (isAuthenticated) {
      const res = await api.post("/add", data);
      return res.data;
    } else {
      const current = getLocalCart();
      const existing = current.find(
        (item) =>
          item.productId === data.productId &&
          item.variantId === data.variantId &&
          item.size === data.size
      );

      if (existing) {
        existing.quantity += data.quantity;
        existing.total = existing.price * existing.quantity;
      } else {
        data.total = data.price * data.quantity;
        current.push(data);
      }

      setLocalCart(current);
      return { items: current, total: calculateTotal(current) };
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    if (isAuthenticated) {
         try {
      const res = await api.put(`/update/${itemId}`, { quantity });
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data?.error || "Failed to update quantity";
      throw new Error(message); // optional: re-throw for caller
    }
    } else {
      const current = getLocalCart().map((item) => {
        const matchKey =
          item.productId + item.variantId + item.size;
        const isMatch = matchKey === itemId;
        return isMatch
          ? { ...item, quantity, total: item.price * quantity }
          : item;
      });
      setLocalCart(current);
      return { items: current, total: calculateTotal(current) };
    }
  };

  const removeItemFromCart = async (itemId) => {
    if (isAuthenticated) {
      const res = await api.delete(`/remove/${itemId}`);
      return res.data;
    } else {
      const filtered = getLocalCart().filter((item) => {
        const matchKey =
          item.productId + item.variantId + item.size;
        return matchKey !== itemId;
      });
      setLocalCart(filtered);
      return { items: filtered, total: calculateTotal(filtered) };
    }
  };

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], coupon: null } }
    );
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
};

const applyCoupon = async (code) => {
  try {
    const res = await api.post("/apply-coupon", { code });
    return res.data; // { success: true, cart }
  } catch (err) {
    return { error: err?.response?.data?.error || "Server error" };
  }
};
const removeCoupon = async () => {
  try {
    const res = await api.post("/remove-coupon");
    return res.data;
  } catch (err) {
    return { error: err?.response?.data?.error || "Failed to remove coupon" };
  }
};



  return {
    getCart,
    addToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
  };
};

export default useCartServices;
