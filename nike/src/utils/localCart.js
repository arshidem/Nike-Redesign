const CART_KEY = "guest_cart";

export const getLocalCart = () => {
  const raw = localStorage.getItem(CART_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setLocalCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const clearLocalCart = () => {
  localStorage.removeItem(CART_KEY);
};
