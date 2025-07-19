// src/features/user/services/wishlistServices.jsx
import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

// 👉 Turn this into a hook
export const useWishlistService = () => {
  const { backendUrl, token } = useAppContext();

  // Create an axios instance configured with baseURL and Auth header
  const api = axios.create({
    baseURL: backendUrl,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Toggle product in wishlist
  const toggleWishlist = async (productId) => {
    try {
      const { data } = await api.post("/api/wishlist", { productId });
      // data: { success, action, wishlist: { products: [...] } }
      return data;
    } catch (error) {
      console.error("Toggle Wishlist Error:", error.response?.data || error);
      throw new Error(
        error.response?.data?.message || "Failed to toggle wishlist"
      );
    }
  };

  // Get wishlist
  const getWishlist = async () => {
    try {
      const { data } = await api.get("/api/wishlist");
      // data: { success, count, data: [...] }
      return data;
      
      
    } catch (error) {
      console.error("Get Wishlist Error:", error.response?.data || error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch wishlist"
      );
    }
  };

  return { toggleWishlist, getWishlist };
};
