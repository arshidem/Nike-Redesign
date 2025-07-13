import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import useOrderServices from "../services/orderServices";
import toast from "react-hot-toast";
import { BackBar } from "../../../shared/ui/Icons";
import AppContext from "../../../context/AppContext";
import {
  CheckIcon,
  TruckIcon,
  BoxIcon,
} from "../../../shared/ui/Icons"; // Include these icons in Icons.jsx
import Footer from "../components/Footer";
const steps = [
  { label: "Order Placed", icon: <CheckIcon className="w-4 h-4" />, key: "createdAt" },
  { label: "Shipped", icon: <TruckIcon className="w-4 h-4" />, key: "shippedAt" },
  { label: "Delivered", icon: <BoxIcon className="w-4 h-4" />, key: "deliveredAt" },
];

const getStatusStep = (status) => {
  switch (status) {
    case "processing": return 0;
    case "shipped": return 1;
    case "delivered": return 2;
    case "cancelled": return -1;
    default: return 0;
  }
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getOrderById } = useOrderServices();
  const { backendUrl } = useContext(AppContext);

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${backendUrl}/${relativePath}`;
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "--";

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await getOrderById(orderId);
      if (res.success) {
        setOrder(res.order);
      } else {
        toast.error(res.error || "Failed to load order");
      }
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="text-center p-10">Loading order details...</div>;
  if (!order) return <div className="text-center text-red-500 mt-10">Order not found.</div>;

  const statusStep = getStatusStep(order.status);

  return (
    <>
      <BackBar />
      <div className="max-w-4xl mx-auto p-6 mt-8 text-black">
        <h2 className="text-3xl font-bold mb-6">Order Details</h2>

        {/* Tracking Bar */}
        {order.status !== "cancelled" ? (
          <div className="px-4 mb-8 text-sm">
            <p className="text-center font-medium mb-1">
              Order Status:{" "}
              <span
                className={`${
                  order.status === "delivered"
                    ? "text-green-600"
                    : order.status === "shipped"
                    ? "text-orange-600"
                    : "text-yellow-600"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </p>

            <p className="text-center text-gray-500 mb-4">
              Estimated Delivery: {formatDate(order.createdAt)} –{" "}
              {formatDate(order.deliveredAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))}
            </p>

            <div className="flex justify-between items-center relative max-w-2xl mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center w-full text-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 z-10 ${
                      i <= statusStep
                        ? "bg-white border-green-500 text-green-600"
                        : "bg-gray-200 border-gray-300 text-gray-400"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <p className="mt-1 font-medium">{step.label}</p>
                  <p className="text-gray-500 text-xs font-semibold">
                    {formatDate(order[step.key])}
                  </p>
                </div>
              ))}
              {/* Progress bar lines */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 z-0" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-green-500 z-0 transition-all duration-300"
                style={{
                  width:
                    statusStep === 0
                      ? "0%"
                      : statusStep === 1
                      ? "50%"
                      : statusStep === 2
                      ? "100%"
                      : "0%",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-red-500 bg-red-100 text-center p-3 rounded-md mb-6 font-medium">
            ❌ This order has been cancelled.
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <p><strong>Order #:</strong> {order._id}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Paid:</strong> {order.isPaid ? `✅ Yes on ${new Date(order.paidAt).toLocaleDateString()}` : "❌ No"}</p>
            <p><strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase()}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Items Price:</strong> ₹{order.itemsPrice.toLocaleString("en-IN")}</p>
            <p><strong>Shipping:</strong> ₹{order.shippingPrice.toLocaleString("en-IN")}</p>
            <p><strong>Tax:</strong> ₹{order.taxPrice.toLocaleString("en-IN")}</p>
            <p className="font-semibold text-lg"><strong>Total:</strong> ₹{order.totalPrice.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-gray-100 p-4 rounded-md mb-6 text-sm">
          <h3 className="font-semibold mb-2">Shipping Address</h3>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
          <p>{order.shippingAddress.country}</p>
          <p>📞 {order.shippingAddress.phone}</p>
        </div>

        {/* Product Items */}
        <div className="bg-white shadow-sm p-4 rounded-md">
          <h3 className="font-semibold mb-4">Products</h3>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between border-b py-3 text-sm">
              <div className="flex items-center gap-4">
                <img
                  src={formatImageUrl(item.image)}
                  alt={item.title}
                  className="w-14 h-14 object-cover rounded bg-gray-100"
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-gray-600">Size: {item.size} | Color: {item.color}</p>
                  <p className="text-gray-600">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="font-semibold">
                ₹{(item.quantity * item.price).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default OrderDetails;
