import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useOrderServices from "../services/orderServices";
import { BackBar } from "../../../shared/ui/Icons";
import toast from "react-hot-toast";
import { useAppContext } from "../../../context/AppContext";
import Footer from "../components/Footer";
import { OrderSkeleton } from "../../../shared/ui/Skeleton";

export default function Order() {
  const { getUserOrders } = useOrderServices();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { backendUrl } = useAppContext();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return `${backendUrl}/${relativePath}`;
  };

  const fetchOrders = async () => {
    setLoading(true);
    const res = await getUserOrders(page, 5);
    if (res.success) {
      setOrders(Array.isArray(res.orders) ? res.orders : []);
      setPagination(res.pagination || {});
    } else {
      toast.error(res.error || "Failed to load orders");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const statusColors = {
    delivered: "bg-green-100 text-green-700",
    shipped: "bg-orange-100 text-orange-700",
    processing: "bg-red-100 text-red-600",
    cancelled: "bg-gray-200 text-gray-600",
  };

  if (loading) return <OrderSkeleton/>;

  return (
    <>
      <BackBar />
      <div className="max-w-4xl mx-auto px-4 py-8 mt-8">
        <h1 className="text-3xl font-bold mb-6">Your Orders</h1>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusKey = order.status?.toLowerCase();
              const statusClass = statusColors[statusKey] || "bg-gray-100 text-gray-700";
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <Link
                  to={`/orders/${order._id}`}
                  key={order._id}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg border hover:border-gray-300 shadow-sm transition"
                >
                  <img
                    src={formatImageUrl(order.items[0]?.product?.featuredImg)}
                    alt="product"
                    className="w-20 h-20 object-contain rounded bg-gray-50"
                  />

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-lg">#{order._id.slice(-6)}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-sm font-medium ${statusClass}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Placed on {formattedDate}
                    </p>
                    <div className="grid grid-cols-2 text-sm text-gray-700 gap-2 mt-1">
                     
                      <p className="font-semibold text-black">
                        Total: ₹{order.totalPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-gray-700">
              {page} / {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Footer/>
    </>
  );
}
