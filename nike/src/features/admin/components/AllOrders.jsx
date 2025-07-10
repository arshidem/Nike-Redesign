import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import useOrderServices from "../../user/services/orderServices";
import Loader from "../../../shared/ui/Loader";
import toast from "react-hot-toast";
import {
  BackBar,
  FilterIcon,
  XIcon,
  SortAscIcon,
  SortDescIcon,
} from "../../../shared/ui/Icons";
import { useAppContext } from "../../../context/AppContext";
import { formatDate, formatCurrency } from "../../../utils/dateUtils";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import EmptyState from "../../../shared/ui/EmptyState";

export const AllOrders = () => {
  const {
    getAllOrders,
    getOrderSummary,
    getOrderTrends,
    getOrderStatusStats,
    updateOrderStatus,
  } = useOrderServices();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sortBy, setSortBy] = useState("-createdAt");
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderRange, setOrderRange] = useState("daily");
  const [statusRange, setStatusRange] = useState("month"); // or your default range

  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    minTotalPrice: "",
    maxTotalPrice: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({});

  const statusColors = {
    processing: "bg-red-100 text-red-600",
    shipped: "bg-orange-100 text-orange-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-gray-200 text-gray-600",
  };
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedOrder?._id) return;

    const prevStatus = selectedOrder.status;
    const updatedOrder = { ...selectedOrder, status: newStatus };

    setSelectedOrder(updatedOrder); // update UI immediately (optimistic)

    const res = await updateOrderStatus(selectedOrder._id, newStatus);

    if (res.success) {
      toast.success("Order status updated");
      fetchOrders(); // refetch orders
      fetchDashboard();
    } else {
      setSelectedOrder({ ...selectedOrder, status: prevStatus }); // rollback
      toast.error(res.error || "Failed to update order status");
    }
  };

  useEffect(() => {
    const fetchTrends = async () => {
      const res = await getOrderTrends(orderRange); // ✅ use selected range
      if (res.success) {
        setDailyData(res.data);
      }
    };
    fetchTrends();
  }, [orderRange]); // ✅ re-run when range changes
  const fetchStatusStats = useCallback(async () => {
    let params = { range: statusRange };

    // If custom range needed, add startDate/endDate here from somewhere (optional)

    const statusRes = await getOrderStatusStats(params);
    if (statusRes.success) setStatusData(statusRes.data);
  }, [statusRange, getOrderStatusStats]);
  useEffect(() => {
    fetchStatusStats();
  }, [statusRange]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 10,
        ...(appliedSearch && { search: appliedSearch }),
        sort: sortBy,
        ...Object.fromEntries(
          Object.entries(appliedFilters).filter(([_, v]) => v)
        ),
      };

      const res = await getAllOrders(params);

      if (res.success) {
        setOrders(res.orders || []);
        setPagination(res.pagination || {});
      } else {
        setError(res.error || "Failed to fetch orders");
        toast.error(res.error || "Failed to fetch orders");
      }
    } catch (err) {
      setError("Unexpected error occurred");
      toast.error("Unexpected error occurred");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, sortBy, appliedFilters]);

  const fetchDashboard = useCallback(async () => {
    const summaryRes = await getOrderSummary();

    // Extract dates from appliedFilters for status stats
    const { startDate, endDate } = appliedFilters;

    // Build range and dates params for getOrderStatusStats
    let params = { range: "custom" }; // default to custom if date filters applied
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else {
      params.range = "month"; // fallback to some default range
    }

    const statusRes = await getOrderStatusStats(params);

    if (summaryRes.success) setSummary(summaryRes.data);
    if (statusRes.success) setStatusData(statusRes.data);
  }, [getOrderSummary, getOrderStatusStats, appliedFilters]);

  useEffect(() => {
    fetchOrders();
    fetchDashboard();
  }, [page, sortBy, appliedSearch, appliedFilters]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchTerm.trim());
    setPage(1);
  }, [searchTerm]);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      const isDesc = prev.startsWith("-");
      const currentField = isDesc ? prev.substring(1) : prev;

      if (currentField !== field) {
        return `-${field}`; // Default to descending for new field
      }
      return isDesc ? field : `-${field}`;
    });
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };

      if (key === "status" && value) {
        updated.isDelivered = ""; // Clear isDelivered when status is selected
      }

      if (key === "isDelivered" && value) {
        updated.status = ""; // Clear status when isDelivered is selected
      }

      return updated;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters); // ✅ Apply only here
    setPage(1);
    setShowFilters(false);
  }, [filters]);

  const resetFilters = useCallback(() => {
    const initial = {
      status: "",
      startDate: "",
      endDate: "",
      minTotalPrice: "",
      maxTotalPrice: "",
    };
    setFilters(initial);
    setShowFilters(false); // ✅ Hide filter modal after reset

    setAppliedFilters({});
    setPage(1);
  }, []);

  const sortConfig = useMemo(() => {
    const field = sortBy.startsWith("-") ? sortBy.substring(1) : sortBy;
    const direction = sortBy.startsWith("-") ? "desc" : "asc";
    return { field, direction };
  }, [sortBy]);

  if (loading && page === 1) return <Loader fullScreen />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow-lg space-y-6 overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-semibold">
                Order #{selectedOrder._id.slice(-6).toUpperCase()}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-xl text-gray-600 hover:text-black"
              >
                ✖
              </button>
            </div>

            {/* User & Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Customer:</strong> {selectedOrder.user?.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.user?.email}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
              </div>
              <div>
                <p>
                  <strong>Total:</strong> ₹{selectedOrder.totalPrice}
                </p>
                <p>
                  <strong>Payment:</strong>{" "}
                  {selectedOrder.isPaid ? "Paid" : "Unpaid"}
                </p>
                {selectedOrder.paidAt && (
                  <p>
                    <strong>Paid At:</strong>{" "}
                    {new Date(selectedOrder.paidAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border rounded p-2"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 object-cover rounded"
                    />
                    <div className="text-sm">
                      <p className="font-medium">{item.title}</p>
                      <p>
                        Qty: {item.quantity} | Size: {item.size} | Color:{" "}
                        {item.color}
                      </p>
                      <p>₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-1">Shipping Address</h3>
              <p>{selectedOrder.shippingAddress.fullName}</p>
              <p>
                {selectedOrder.shippingAddress.street},{" "}
                {selectedOrder.shippingAddress.city},{" "}
                {selectedOrder.shippingAddress.state} -{" "}
                {selectedOrder.shippingAddress.postalCode}
              </p>
              <p>{selectedOrder.shippingAddress.country}</p>
              <p>📞 {selectedOrder.shippingAddress.phone}</p>
            </div>

            {/* Update Status */}
            <div>
              <label className="font-medium text-sm">Update Order Status</label>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="block w-full mt-1 border rounded px-3 py-2 bg-white"
              >
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="mt-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Filter Orders</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                >
                  <option value="">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Total Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={filters.minTotalPrice}
                    onChange={(e) =>
                      handleFilterChange("minTotalPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Total Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={filters.maxTotalPrice}
                    onChange={(e) =>
                      handleFilterChange("maxTotalPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <XIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Today
            </h4>
            <p className="text-xl font-bold">{summary.todayOrders} Orders</p>
            <p className="text-sm text-gray-500">
              {formatCurrency(summary.todayRevenue)}
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              This Week
            </h4>
            <p className="text-xl font-bold">{summary.weekOrders} Orders</p>
            <p className="text-sm text-gray-500">
              {formatCurrency(summary.weekRevenue)}
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              This Month
            </h4>
            <p className="text-xl font-bold">{summary.monthOrders} Orders</p>
            <p className="text-sm text-gray-500">
              {formatCurrency(summary.monthRevenue)}
            </p>
          </div>
          <div className="p-4 bg-white border rounded-lg shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Total Revenue
            </h4>
            <p className="text-xl font-bold">{summary.totalOrders} Orders</p>

            <p className="text-xl font-bold">
              {formatCurrency(summary.totalRevenue)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-600">Order Trend</h2>
            <select
              value={orderRange}
              onChange={(e) => setOrderRange(e.target.value)}
              className="border px-2 py-1 text-sm rounded"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                tickFormatter={(str) => {
                  try {
                    if (orderRange === "yearly") return str;
                    if (orderRange === "monthly")
                      return format(new Date(`${str}-01`), "MMM yyyy");
                    if (orderRange === "weekly") return `Wk ${str}`;
                    return format(new Date(str), "MMM d");
                  } catch (err) {
                    return str;
                  }
                }}
              />

              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#111"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-600">
              Status Breakdown
            </h2>
            <select
              value={statusRange}
              onChange={(e) => setStatusRange(e.target.value)}
              className="border px-2 py-1 text-sm rounded"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#f87171", "#facc15", "#34d399", "#9ca3af"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex w-full sm:w-auto gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setAppliedSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            disabled={loading}
          >
            <FilterIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {orders.length === 0 && !loading ? (
          <EmptyState
            title="No orders found"
            description="Try adjusting your search or filters"
            actionText="Reset Filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig.field === "createdAt" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAscIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <SortDescIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("totalPrice")}
                    >
                      <div className="flex items-center">
                        Total
                        {sortConfig.field === "totalPrice" &&
                          (sortConfig.direction === "asc" ? (
                            <SortAscIcon className="ml-1 w-4 h-4" />
                          ) : (
                            <SortDescIcon className="ml-1 w-4 h-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Delivered
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user?.name || "Guest"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[order.status]
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.isDelivered ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ❌ Not Delivered
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading && page > 1 && (
              <div className="flex justify-center p-4">
                <Loader size="small" />
              </div>
            )}

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              {/* Mobile Pagination */}
              <div className="flex items-center justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(page * 10, pagination.totalItems)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalItems}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>‹
                    </button>
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? "z-10 bg-black border-black text-white"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      disabled={page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>›
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
