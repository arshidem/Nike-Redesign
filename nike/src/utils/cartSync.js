import axios from "axios";
import { getLocalCart, clearLocalCart } from "./localCart";

export const syncGuestCartToServer = async (token, backendUrl) => {
  const localCartItems = getLocalCart();
  if (!localCartItems.length) return;

  try {
    await axios.post(
      `${backendUrl}/api/cart/sync`,
      { items: localCartItems },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    // ✅ Clear local cart after sync
    clearLocalCart();
  } catch (err) {
    console.error("Cart sync failed", err);
  }
};
