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
      if (!items.length) return { items, total: 0 };
      const response = await api.post("/stock", { items: items.map(({ productId, variantId, size }) => ({ productId, variantId, size })) });
      const refreshed = items.map(item => {
        const snapshot = response.data.items.find(entry => entry.productId === item.productId && entry.variantId === item.variantId && entry.size === item.size);
        if (!snapshot) throw new Error("Could not check bag availability");
        return { ...item, stock: snapshot.stock, stockAvailable: snapshot.stockAvailable };
      });
      setLocalCart(refreshed);
      return { items: refreshed, total: calculateTotal(refreshed) };
    }
  };

  // Share the authoritative response with the mini cart and existing bag listeners.
  const publish = (cart, added) => {
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: cart }));
    if (added) window.dispatchEvent(new CustomEvent("cartAdded", { detail: { cart, added } }));
    return cart;
  };

  const addToCart = async (data) => {
    if (isAuthenticated) {
      const res = await api.post("/add", data);
      return publish(res.data, data);
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
      return publish({ items: current, total: calculateTotal(current) }, data);
    }
  };

  const updateItemQuantity = async (itemId, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive whole number");
    if (isAuthenticated) {
         try {
      const res = await api.put(`/update/${itemId}`, { quantity });
      return publish(res.data);
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
        if (isMatch && quantity > item.quantity && quantity > Number(item.stock || 0)) throw new Error(`Only ${item.stock || 0} available`);
        return isMatch
          ? { ...item, quantity, total: item.price * quantity }
          : item;
      });
      setLocalCart(current);
      return publish({ items: current, total: calculateTotal(current) });
    }
  };

  const removeItemFromCart = async (itemId) => {
    if (isAuthenticated) {
      const res = await api.delete(`/remove/${itemId}`);
      return publish(res.data);
    } else {
      const filtered = getLocalCart().filter((item) => {
        const matchKey =
          item.productId + item.variantId + item.size;
        return matchKey !== itemId;
      });
      setLocalCart(filtered);
      return publish({ items: filtered, total: calculateTotal(filtered) });
    }
  };

// cartServices.jsx
const clearCart = async () => {
  if (isAuthenticated) {
    try {
      const response = await api.delete("/clear"); // token is already included in api instance
      return response.data;
    } catch (err) {
      console.error("❌ clearCart failed:", err.response?.data || err.message);
      throw err;
    }
  } else {
    setLocalCart([]); // clear localStorage cart
    return { items: [], total: 0 };
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
