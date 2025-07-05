import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowIconLeft,
  DeleteIcon,
  PlusIcon,
  MinusIcon,
  XIcon,
  BackNavigate
} from "../../../shared/ui/Icons";
import Loader from "../../../shared/ui/Loader";
import useCartServices from "../services/cartServices";
import { useAppContext } from "../../../context/AppContext";

const Cart = () => {
  const {
    getCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCartServices();

  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const { backendUrl } = useAppContext();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${backendUrl}/${relativePath}`;
  };

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
    setLoading(false);
  };

  const handleQuantityChange = async (itemId, newQty) => {
    try {
      const updatedCart = await updateItemQuantity(itemId, newQty);
      setCart(updatedCart);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong while updating quantity";
      toast.error(msg);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const data = await removeItemFromCart(itemId);
      setCart(data);
    } catch (err) {
      console.error("Remove failed");
    }
  };

  const handleClear = async () => {
    try {
      const data = await clearCart();
      setCart(data.cart);
    } catch (err) {
      console.error("Clear cart failed");
    }
  };

 const handleApplyCoupon = async () => {
  try {
    const response = await applyCoupon(couponCode);
    if (response?.success) {
      setCart(response.cart);
      setCouponCode(response.cart.coupon?.code || ""); // ← this ensures the applied code is visible
      toast.success("Coupon applied successfully");
    } else {
      toast.error(response?.error || "Failed to apply coupon");
    }
  } catch (err) {
    toast.error("Coupon apply failed");
  }
};

  const handleRemoveCoupon = async () => {
    try {
      const data = await removeCoupon();
      if (data?.success) {
        setCart(data.cart);
        setCouponCode(""); // 🧹 clear input on removal
        toast.success("Coupon removed");
      } else {
        toast.error(data.error || "Failed to remove coupon");
      }
    } catch (err) {
      toast.error("Error removing coupon");
    }
  };

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Your Bag is Empty
        </h2>
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-8">
      <Toaster position="top-center" />
      <BackNavigate/>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Bag Section */}
        <div className="flex-1">
{/* Cart Header Summary */}
<div className="text-center mb-8">
  <h1 className="text-2xl font-bold">Bag</h1>
  <p className="text-sm text-gray-600 mt-1">
    {cart.items?.length} item{cart.items.length > 1 ? "s" : ""} | ₹{(cart.finalTotal ?? cart.total ?? 0).toLocaleString()}
  </p>
</div>
          <ul className="space-y-8">
            {cart.items?.map((item) => {
              const localId =
                item._id || `${item.productId}${item.variantId}${item.size}`;

              return (
                <li
                  key={localId}
                  className="flex flex-col md:flex-row gap-6 border-b pb-6"
                >
                  {/* Image */}
                  <div className="w-full md:w-40 shrink-0">
                    <img
                      src={formatImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-40 object-contain bg-gray-100 rounded-lg"
                      onError={(e) => {
                        e.target.src = "/placeholder.jpg";
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.gender || "Men's Shoe"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.color} | Size{" "}
                        <span className="underline">{item.size}</span>
                      </p>
                    </div>

                    {/* Notice */}
                    {item.stock <= 3 && (
                      <p className="text-xs text-yellow-600 mt-2 hidden md:block">
                        <span className="inline-block mr-1">🕒</span> Just a few
                        left. Order soon.
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() =>
                          item.quantity === 1
                            ? handleRemove(localId)
                            : handleQuantityChange(localId, item.quantity - 1)
                        }
                        className="border p-2 rounded-full text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {item.quantity === 1 ? (
                          <DeleteIcon className="w-4 h-4" />
                        ) : (
                          <MinusIcon className="w-4 h-4" />
                        )}
                      </button>

                      <span className="text-sm font-medium">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          if (item.quantity < item.stock) {
                            handleQuantityChange(localId, item.quantity + 1);
                          } else {
                            toast.error("Reached max stock limit");
                          }
                        }}
                        className="border p-2 rounded-full text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right md:text-left">
                    <p className="text-lg font-semibold">
                      ₹{(item?.total ?? 0).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Summary Section */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4">Summary</h2>

          
            {/* Prices */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>₹
                {(cart.subtotal ?? cart.total ?? 0).toLocaleString()}
              </div>

          

              <div className="flex justify-between">
                <span>Estimated Delivery & Handling</span>₹
                {(cart.shippingFee ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>Total</span>₹
              {(cart.finalTotal ?? cart.total ?? 0).toLocaleString()}
            </div>

         <button
  onClick={() => navigate('/checkout')}
  disabled={cart.length === 0}
  className={`w-full mt-6 py-3 rounded-full font-semibold ${
    cart.length === 0
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-black text-white hover:bg-gray-800"
  }`}
>
  Go to Checkout
</button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
