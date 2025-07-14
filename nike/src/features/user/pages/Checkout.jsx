import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, BackBar } from "../../../shared/ui/Icons";
import useAddressService from "../services/addressServices";
import useOrderServices from '/src/features/user/services/orderServices.jsx';
import useCartServices from "../services/cartServices";
// Remove the curly braces {}import useCartServices from "../services/cartServices";
import { loadScript } from "../../../utils/loadRazorpayScript";
import toast from "react-hot-toast";
import { useAppContext } from "../../../context/AppContext";
import Footer from "../components/Footer";
import { CheckoutSkeleton } from "../../../shared/ui/Skeleton";

const Checkout = () => {
  const navigate = useNavigate();
  const { user, backendUrl } = useAppContext();
  const { getAddresses } = useAddressService();
  const { initiatePayment, verifyPayment } = useOrderServices();
  const { getCart, applyCoupon, removeCoupon, clearCart } = useCartServices();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [cart, setCart] = useState({ 
    items: [], 
    total: 0, 
    subtotal: 0, 
    shipping: 0, 
    coupon: null 
  });
  const [couponCode, setCouponCode] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  // Format currency consistently
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Memoized cart calculations
  const cartCalculations = useMemo(() => {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = cart.shippingFee || 1250;
    const discount = cart.coupon?.discountAmount || 0;
    const total = subtotal + shipping - discount;
    
    return { subtotal, shipping, discount, total };
  }, [cart.items, cart.shippingFee, cart.coupon]);

  const formatImageUrl = useCallback((imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${cleanBackendUrl}/${relativePath}`;
  }, [backendUrl]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateAddress = useCallback(() => {
    const errors = {};
    if (!addressForm.fullName.trim()) errors.fullName = "Full name is required";
    if (!addressForm.phone.trim()) errors.phone = "Phone is required";
    if (!/^[0-9]{10,15}$/.test(addressForm.phone)) errors.phone = "Please enter a valid phone number";
    if (!addressForm.street.trim()) errors.street = "Street is required";
    if (!addressForm.city.trim()) errors.city = "City is required";
    if (!addressForm.state.trim()) errors.state = "State is required";
    if (!addressForm.postalCode.trim()) errors.postalCode = "Postal code is required";
    if (!/^[0-9]{6}$/.test(addressForm.postalCode)) errors.postalCode = "Please enter a valid 6-digit postal code";
    if (!addressForm.country.trim()) errors.country = "Country is required";
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  }, [addressForm]);

  useEffect(() => {
    let isMounted = true;
    let paymentTimeout;
    
    const fetchData = async () => {
      try {
        const [addressData, cartData] = await Promise.all([
          getAddresses(),
          getCart()
        ]);

        if (isMounted) {
          setAddresses(addressData);
          const defaultAddress = addressData.find((a) => a.isDefault) || addressData[0];
          setSelectedAddress(defaultAddress);
          if (defaultAddress) setAddressForm({ ...defaultAddress });

          setCart({
            ...cartData,
            subtotal: cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            shipping: cartData.shippingFee || 1250,
          });

          // Initialize image loading states
          const initialLoadingStates = {};
          cartData.items.forEach(item => {
            initialLoadingStates[item._id || item.productId] = true;
          });
          setImageLoadingStates(initialLoadingStates);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(paymentTimeout);
    };
  }, [getAddresses, getCart]);

  useEffect(() => {
    if (Object.keys(addressErrors).length > 0) {
      validateAddress();
    }
  }, [addressForm, addressErrors, validateAddress]);

  const handleAddressClick = (address) => {
    setSelectedAddress(address);
    setAddressForm({ ...address });
    setAddressErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
    if (addressErrors[name]) {
      setAddressErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    try {
      const normalizedCouponCode = couponCode.trim().toUpperCase();
      const result = await applyCoupon(normalizedCouponCode);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Coupon applied");
        setCart(result.cart);
        setCouponCode("");
      }
    } catch (error) {
      toast.error(error.message || "Failed to apply coupon");
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      const result = await removeCoupon();
      if (result.error) {
        toast.error(result.error);
      } else {
        setCart(result.cart);
        toast.success("Coupon removed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to remove coupon");
    }
  };

  const handleImageLoad = (itemId) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }));
  };

const handlePayment = async () => {
  // Validate address
  if (!validateAddress()) {
    toast.error("Please fix all address errors before proceeding");
    return;
  }

  // Validate email
  if (!validateEmail(user?.email)) {
    toast.error("Please enter a valid email address");
    return;
  }

  // Check if cart is empty
  if (cart.items.length === 0) {
    toast.error("Your cart is empty");
    return;
  }

  setIsPlacingOrder(true);
  const paymentTimeout = setTimeout(() => {
    toast.error("Payment is taking longer than expected. Please check your payment status.");
    setIsPlacingOrder(false);
  }, 30000);

  try {
    // Load Razorpay script
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    // Prepare payment details
    const receiptId = `rcpt_${Date.now()}`;
const amountInPaise = Math.round(cartCalculations.total * 100);

if (amountInPaise > 50000000) { // ₹5,00,000
  toast.error("The order amount exceeds the allowed limit of ₹5,00,000");
  setIsPlacingOrder(false);
  return;
}
console.log("Cart Total ₹:", cartCalculations.total);

console.log("Amount in Paise:", amountInPaise);


    // 🔧 FIXED: Correctly call initiatePayment with 2 arguments
    const paymentInit = await initiatePayment(amountInPaise, receiptId);

    console.log("paymentInit response:", paymentInit);

  const order = paymentInit?.data?.data?.order;

if (!paymentInit?.success || !order) {
  throw new Error(paymentInit?.error || "Payment initiation failed");
}


    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Your Store",
      description: "Order Payment",
      order_id: order.id,
      handler: async (response) => {
        clearTimeout(paymentTimeout);
        try {
          const result = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: cartCalculations.total,
            email: user.email,
            items: cart.items.map(item => ({
              product: item.productId || item.product,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
              color:item.color,
              title:item.name,
              image:item.image,
              variantId:item.variantId
            })),
            address: addressForm,
            userId: user._id,
            couponCode: cart?.coupon?.code || null
          });

          await clearCart();
          setCart({ items: [], total: 0, subtotal: 0, shipping: 0, coupon: null });
          setAddressForm({
            fullName: "",
            phone: "",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          });

          toast.success(
            <div>
              <p>Order placed successfully!</p>
              <p>A confirmation has been sent to {user.email}</p>
            </div>,
            { duration: 5000 }
          );

          navigate("/orders", { state: { order: result.order } });
        } catch (err) {
          toast.error(err.message || "Payment verification failed");
        } finally {
          setIsPlacingOrder(false);
        }
      },
      theme: { color: "#000000" },
      modal: {
        ondismiss: () => {
          clearTimeout(paymentTimeout);
          setIsPlacingOrder(false);
          toast.info("Payment window closed");
        }
      }
    });

    rzp.on('payment.failed', (response) => {
      clearTimeout(paymentTimeout);
      toast.error(`Payment failed: ${response.error.description}`);
      setIsPlacingOrder(false);
    });

    rzp.open();
  } catch (error) {
    clearTimeout(paymentTimeout);
    console.error("Payment error:", error);
    toast.error(error.message || "Payment initiation failed");
    setIsPlacingOrder(false);
  }
};

  if (isLoading) {
    return (
      <CheckoutSkeleton/>
    );
  }

  if (cart.items.length === 0) {
    return (
      <>
          <BackBar/>
      <div className="max-w-5xl mx-auto p-4 mt-12">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <button 
            onClick={() => navigate('/products')}
            className="mt-4 bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    <BackBar/>
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
        <input
          type="email"
          defaultValue={user?.email || ""}
          placeholder="Email"
          className="w-full border border-black px-4 py-2 mb-2 text-sm rounded"
          disabled
        />
        <p className="text-xs text-gray-500 mb-4">
          A confirmation email will be sent after checkout.
        </p>

        {addresses.length > 0 && (
          <>
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
          </>
        )}

        <h3 className="text-sm font-medium mb-2">
          {addresses.length > 0 ? "Edit Address" : "Add Delivery Address"}
        </h3>

    {[
  ["fullName", "phone"],
  ["street"],
  ["city", "state"],
  ["postalCode", "country"]
].map((row, rowIndex) => (
  <div key={`row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
    {row.map((field) => (
      <div 
        key={field} 
        className={field === "street" ? "sm:col-span-2" : ""}
      >
        <input
          name={field}
          value={addressForm[field] || ""}
          onChange={handleInputChange}
          placeholder={field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
          className={`w-full border px-4 py-2 rounded text-sm ${
            addressErrors[field] ? "border-red-500" : "border-black"
          }`}
        />
        {addressErrors[field] && (
          <p className="text-xs text-red-500 mt-1">{addressErrors[field]}</p>
        )}
      </div>
    ))}
  </div>
))}
      </div>

      {/* RIGHT - Summary */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Review your cart</h3>

        <div className="max-h-96 overflow-y-auto pr-2">
          {cart.items.map((item) => (
            <div key={item._id || item.productId} className="flex gap-4 mb-4">
              <div className="relative">
                <img
                  src={formatImageUrl(item.image)}
                  alt={item.name}
                  className={`w-20 h-20 border rounded-md object-cover ${
                    imageLoadingStates[item._id || item.productId] ? 'bg-gray-200' : ''
                  }`}
                  onLoad={() => handleImageLoad(item._id || item.productId)}
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                    handleImageLoad(item._id || item.productId);
                  }}
                />
                {imageLoadingStates[item._id || item.productId] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-800 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-gray-600">Qty: {item.quantity}</p>
                {item.size && <p className="text-gray-600">Size: {item.size}</p>}
                <p className="font-semibold mt-1">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm mt-4 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(cartCalculations.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatCurrency(cartCalculations.shipping)}</span>
          </div>
          {cart?.coupon?.applied && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({cart.coupon.code})</span>
              <span>-{formatCurrency(cartCalculations.discount)}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>{formatCurrency(cartCalculations.total)}</span>
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
              maxLength={20}
              className="flex-1 border border-black px-4 py-2 rounded-full text-sm"
            />
            {cart?.coupon?.applied ? (
              <button
                onClick={handleRemoveCoupon}
                className="px-2 py-2 text-red-600 border border-red-500 rounded-full hover:bg-red-50 transition"
                aria-label="Remove coupon"
              >
                <XIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleApplyCoupon}
                disabled={!couponCode.trim()}
                className="bg-black hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm disabled:bg-gray-400 transition"
              >
                Apply
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={isPlacingOrder || cart.items.length === 0}
          className="w-full bg-black hover:bg-gray-700 text-white py-3 rounded-full font-medium mt-6 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
          aria-label="Pay Now"
          aria-busy={isPlacingOrder}
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
            `Pay ${formatCurrency(cartCalculations.total)}`
          )}
        </button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          By completing your purchase, you agree to our Terms of Service
        </p>
      </div>
     
    </div>
     <Footer/>
    </>
  );
};

export default Checkout;