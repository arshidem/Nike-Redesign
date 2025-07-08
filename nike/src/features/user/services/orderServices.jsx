import axios from 'axios';
import { useAppContext } from '../../../context/AppContext';

const useOrderServices = () => {
  const { backendUrl, token, user } = useAppContext();

  // Axios instance with base URL and headers
  const api = axios.create({
    baseURL: `${backendUrl}/api/orders`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
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
      amount:amount,
      receipt,
      notes: {
        userId: user?._id || "guest",
        email: user?.email || "no-email@placeholder.com",
        purpose: "ecommerce_purchase",
        timestamp: new Date().toISOString()
      }
    };

    if (!amount || amount < 1 || !receipt) {
      console.warn("initiatePayment: Invalid input:", payload);
      return {
        success: false,
        error: "Invalid payment input (amount or receipt)",
        status: 400,
        data: payload
      };
    }

    try {
      const response = await api.post('/initiate-payment', payload);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payment initiation failed:', error);

      const errorMessage = error.response?.data?.message ||
        (error.request ? "Network error" : "Unexpected error");

      return {
        success: false,
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  };

  /**
   * Verify Razorpay payment
   * @param {object} paymentData - Data from Razorpay checkout
   */
  const verifyPayment = async (paymentData) => {
    try {
      const response = await api.post('/verify-payment', {
        ...paymentData,
        metadata: {
          userId: user?._id || null,
          userAgent: navigator.userAgent
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Payment verification failed:', error);
      const message = error.response?.data?.message || 'Payment verification failed';

      return {
        success: false,
        error: message,
        status: error.response?.status,
        shouldRetry: !error.response || error.response.status >= 500,
        data: error.response?.data
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
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch orders',
        status: error.response?.status
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
        order: response.data
      };
    } catch (error) {
      console.error('Failed to fetch order:', error);
      const message = error.response?.status === 404
        ? 'Order not found'
        : error.response?.data?.message || 'Failed to fetch order';

      return {
        success: false,
        error: message,
        status: error.response?.status
      };
    }
  };

  return {
    initiatePayment,
    verifyPayment,
    getUserOrders,
    getOrderById,
  };
};

export default useOrderServices;
