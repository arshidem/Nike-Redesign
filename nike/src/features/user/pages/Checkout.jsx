import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, ArrowIconLeft,BackNavigate } from "../../../shared/ui/Icons";
import useAddressService from "../services/addressServices";
import useOrderServices from "../services/orderServices";
import useCartServices from "../services/cartServices";
import { loadScript } from "../../../utils/loadRazorpayScript";
import toast from "react-hot-toast";
import { useAppContext } from "../../../context/AppContext";

// ... (imports remain unchanged)

const Checkout = () => {
  const navigate = useNavigate();
  const { user, backendUrl } = useAppContext();
  const { getAddresses } = useAddressService();
  const { createOrder, verifyPayment } = useOrderServices();
  const { getCart, applyCoupon, removeCoupon, clearCart } = useCartServices();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${backendUrl}/${relativePath}`;
  };

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [cart, setCart] = useState({ items: [], total: 0, coupon: null });
  const [couponCode, setCouponCode] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const addressData = await getAddresses();
        setAddresses(addressData);
        const defaultAddress = addressData.find((a) => a.isDefault) || addressData[0];
        setSelectedAddress(defaultAddress);
        setAddressForm({ ...defaultAddress });
      } catch {
        toast.error("Failed to load addresses");
      }

      try {
        const cartData = await getCart();
        setCart({
          ...cartData,
          subtotal: cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          shipping: 1250,
        });
      } catch {
        toast.error("Failed to load cart");
      }
    })();
  }, []);

  const handleAddressClick = (address) => {
    setSelectedAddress(address);
    setAddressForm({ ...address });
  };

  const handleInputChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Coupon applied");
      setCart(result.cart);
    }
  };

  const handleRemoveCoupon = async () => {
    const result = await removeCoupon();
    if (result.error) toast.error(result.error);
    else setCart(result.cart);
  };

  const handlePayment = async () => {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    setIsPlacingOrder(true);

    try {
      const { order } = await createOrder({ amount: cart.total, receipt: `rcpt_${Date.now()}` });

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Your Store",
        description: "Order Payment",
        order_id: order.id,
        handler: async function (response) {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: cart.total,
              items: cart.items.map((item) => ({
                product: item.productId || item.product,
                quantity: item.quantity,
                price: item.price,
              })),
              address: addressForm,
            });

            await clearCart();
            setCart({ items: [], total: 0, subtotal: 0, shipping: 0, coupon: null });
            toast.success("Order placed successfully");
            navigate("/home");
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#000000" },
      });

      rzp.open();
    } catch {
      toast.error("Payment initiation failed");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <BackNavigate/>
        
      {/* LEFT - Address Form */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>

        <input
          type="email"
          defaultValue={user?.email || ""}
          placeholder="Email"
          className="w-full border border-black px-4 py-2 mb-2 text-sm rounded-full"
        />
        <p className="text-xs text-gray-500 mb-4">
          A confirmation email will be sent after checkout.
        </p>

        <label className="block text-sm font-medium mb-1">Select Delivery Address</label>
        <div className="space-y-2 mb-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              onClick={() => handleAddressClick(address)}
              className={`p-3 border rounded cursor-pointer text-sm ${
                selectedAddress?._id === address._id ? "border-black" : "border-gray-300"
              }`}
            >
              <p className="font-medium">{address.fullName}</p>
              <p>{address.street}, {address.city}, {address.state} - {address.postalCode}</p>
              <p>{address.country} | {address.phone}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["fullName", "phone", "street", "city", "state", "postalCode", "country"].map((field, i) => (
            <input
              key={field}
              name={field}
              value={addressForm[field]}
              onChange={handleInputChange}
              placeholder={field.replace(/([A-Z])/g, " $1")}
              className={`border border-black px-4 py-2 rounded-full ${field === "street" ? "sm:col-span-2" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT - Summary */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Review your cart</h3>

        {cart.items.map((item) => (
          <div key={item._id || item.productId} className="flex gap-4 mb-4">
            <img
              src={formatImageUrl(item.image)}
              alt={item.name}
              className="w-20 h-20 border rounded-md object-cover"
            />
            <div className="text-sm text-gray-800">
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-600">Qty {item.quantity}</p>
              <p className="text-gray-600">Size {item.size}</p>
              <p className="font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          </div>
        ))}

        <div className="space-y-2 text-sm mt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{cart.subtotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹{(cart.shippingFee || 0).toLocaleString()}</span>
          </div>
          {cart?.coupon?.applied && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{cart.coupon.discountAmount.toLocaleString()}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>₹{cart.total?.toLocaleString()}</span>
          </div>
        </div>

        {/* Coupon */}
        <div className="mt-4">
          <label htmlFor="coupon" className="text-sm font-medium block mb-1">
            Discount code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              type="text"
              placeholder="Enter code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={cart?.coupon?.applied}
              className="flex-1 border border-black px-4 py-2 rounded-full text-sm"
            />
            {cart?.coupon?.applied ? (
              <button
                onClick={handleRemoveCoupon}
                className="px-2 py-2 text-red-600 border border-red-500 rounded-full"
              >
                <XIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleApplyCoupon}
                className="bg-black hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm"
              >
                Apply
              </button>
            )}
          </div>
        </div>

     <button
  onClick={handlePayment}
  disabled={isPlacingOrder}
  className="w-full bg-black hover:bg-gray-700 text-white py-3 rounded-full font-medium mt-6 transition flex items-center justify-center gap-2"
>
  {isPlacingOrder ? (
    <>
      <svg
        className="animate-spin h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Processing...
    </>
  ) : (
    "Pay Now"
  )}
</button>

      </div>
    </div>
  );
};

export default Checkout;
