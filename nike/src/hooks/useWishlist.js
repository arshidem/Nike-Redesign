// hooks/useWishlist.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlistService } from "../features/user/services/wishlistServices";
import { toast } from "react-hot-toast";

export const useWishlist = (user) => {
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const navigate = useNavigate();
  const { toggleWishlist, getWishlist } = useWishlistService();

  // Fetch wishlist on mount (if user is logged in)
  useEffect(() => {
    const fetchWishlist = async () => {
      if (user) {
        try {
          const response = await getWishlist();
          const wishlistProductIds = response.data.map((product) => product._id);
          setWishlistIds(wishlistProductIds);
        } catch (err) {
          console.error("Failed to fetch wishlist", err);
          toast.error("Failed to load wishlist");
        }
      }
    };

    fetchWishlist();
  }, [user]);

  // Check if a product is in wishlist
  const isInWishlist = (productId) => wishlistIds.includes(productId);

  // Toggle wishlist status
  const handleWishlistToggle = async (productId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading((prev) => ({ ...prev, [productId]: true }));
      const response = await toggleWishlist(productId);
      const updatedWishlistIds = response.wishlist.map((product) => product._id);
      setWishlistIds(updatedWishlistIds);

      toast.success(
        response.action === "added" 
          ? "Added to wishlist!" 
          : "Removed from wishlist!"
      );
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return { wishlistIds, wishlistLoading, isInWishlist, handleWishlistToggle };
};