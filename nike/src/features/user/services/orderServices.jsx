import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

const useOrderServices = () => {
  const { backendUrl, token, user } = useAppContext();

  // Axios instance with base URL and headers
  const api = axios.create({
    baseURL: `${backendUrl}/api/orders`,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor for token
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * Initiate Razorpay payment
   * @param {number} amount - Amount in rupees
   * @param {string} receipt - Receipt string (e.g. "rcpt_123")
   */
  const initiatePayment = async (amount, receipt) => {
    const payload = {
      amount: amount,
      receipt,
      notes: {
        userId: user?._id || "guest",
        email: user?.email || "no-email@placeholder.com",
        purpose: "ecommerce_purchase",
        timestamp: new Date().toISOString(),
      },
    };

    if (!amount || amount < 1 || !receipt) {
      console.warn("initiatePayment: Invalid input:", payload);
      return {
        success: false,
        error: "Invalid payment input (amount or receipt)",
        status: 400,
        data: payload,
      };
    }

    try {
      const response = await api.post("/initiate-payment", payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Payment initiation failed:", error);

      const errorMessage =
        error.response?.data?.message ||
        (error.request ? "Network error" : "Unexpected error");

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      };
    }
  };

  /**
   * Verify Razorpay payment
   * @param {object} paymentData - Data from Razorpay checkout
   */
  const verifyPayment = async (paymentData) => {
    try {
      const response = await api.post("/verify-payment", {
        ...paymentData,
        metadata: {
          userId: user?._id || null,
          userAgent: navigator.userAgent,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Payment verification failed:", error);
      const message =
        error.response?.data?.message || "Payment verification failed";

      return {
        success: false,
        error: message,
        status: error.response?.status,
        shouldRetry: !error.response || error.response.status >= 500,
        data: error.response?.data,
      };
    }
  };

  /**
   * Get logged-in user's paginated orders
   */
  const getUserOrders = async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/my-orders?page=${page}&limit=${limit}`);
      return {
        success: true,
        orders: response.data.orders,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch orders",
        status: error.response?.status,
      };
    }
  };

  /**
   * Get single order by ID
   */
  const getOrderById = async (orderId) => {
    try {
      const response = await api.get(`/${orderId}`);
      return {
        success: true,
        order: response.data,
      };
    } catch (error) {
      console.error("Failed to fetch order:", error);
      const message =
        error.response?.status === 404
          ? "Order not found"
          : error.response?.data?.message || "Failed to fetch order";

      return {
        success: false,
        error: message,
        status: error.response?.status,
      };
    }
  };

  /**
   * Get all orders (admin only) with search, filters, and pagination
   * @param {Object} params - Query parameters
   */
  const getAllOrders = async (params = {}) => {
    // Default parameters
    const defaultParams = {
      page: 1,
      limit: 10,
      sort: "-createdAt", // newest first by default
    };

    // Merge default params with provided params
    const queryParams = {
      ...defaultParams,
      ...params,
    };

    // Clean up parameters (remove empty values)
    const cleanedParams = Object.fromEntries(
      Object.entries(queryParams).filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
    );

    try {
      const response = await api.get("/", {
        params: cleanedParams,
        paramsSerializer: (params) =>
          Object.entries(params)
            .map(([key, value]) =>
              Array.isArray(value)
                ? `${key}=${value.join(",")}`
                : `${key}=${value}`
            )
            .join("&"),
      });

      return {
        success: true,
        orders: response.data.orders,
        pagination: response.data.pagination,
        filters: response.data.availableFilters, // if backend provides
      };
    } catch (error) {
      console.error("Failed to fetch all orders (admin):", error);

      let errorMessage = "Failed to fetch orders";
      if (error.response) {
        if (error.response.status === 401)
          errorMessage = "Unauthorized - Admin access required";
        else if (error.response.status === 403)
          errorMessage = "Forbidden - Insufficient permissions";
        else errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = "Network error - Could not connect to server";
      }

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        shouldRetry: !error.response || error.response.status >= 500,
      };
    }
  };
  /**
/**
 * Update order status
 * @param {string} orderId - The order ID
 * @param {string} newStatus - The new status (e.g., "processing", "shipped", etc.)
 */
const updateOrderStatus = async (orderId, newStatus) => {
  if (!orderId || !newStatus) {
    return {
      success: false,
      error: "Order ID and new status are required",
    };
  }

  try {
    const res = await api.put(`/${orderId}/status`, {
      status: newStatus,
    });

    return {
      success: true,
      data: res.data,
    };
  } catch (err) {
    console.error("Failed to update order status:", err);
    return {
      success: false,
      error: err.response?.data?.message || "Failed to update order status",
      status: err.response?.status,
    };
  }
};

  /**
   * Get order summary for admin dashboard
   */
  const getOrderSummary = async () => {
    try {
      const response = await api.get("/summary");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Failed to fetch order summary:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch order summary",
        status: error.response?.status,
      };
    }
  };

  /**
   * Get daily order data for the last 30 days (line chart)
   */
const getOrderTrends = async (range = "daily") => {
  try {
    const response = await api.get(`/trends?range=${range}`);
    return {
      success: true,
      data: response.data, // array of { _id, count, revenue }
    };
  } catch (error) {
    console.error("Failed to fetch order trends:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch order trends",
      status: error.response?.status,
    };
  }
};


  /**
   * Get order status breakdown for admin pie chart
   */
const getOrderStatusStats = async ({ range = "today", startDate, endDate } = {}) => {
  try {
    // Build query params string dynamically
    let query = `?range=${range}`;
    if (range === "custom" && startDate && endDate) {
      query += `&startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await api.get(`/status${query}`);
    return {
      success: true,
      data: response.data, // array of { _id: 'status', count }
    };
  } catch (error) {
    console.error("Failed to fetch order status stats:", error);
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch status stats",
      status: error.response?.status,
    };
  }
};


  return {
    initiatePayment,
    verifyPayment,
    getUserOrders,
    getOrderById,
    getAllOrders,
    getOrderSummary,
    getOrderTrends,
    getOrderStatusStats,
    updateOrderStatus,
  };
};

export default useOrderServices;
