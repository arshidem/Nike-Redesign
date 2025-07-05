import axios from 'axios';
import { useAppContext } from '../../../context/AppContext';

const useOrderServices = () => {
  const { backendUrl, token } = useAppContext();

  const api = axios.create({
    baseURL: `${backendUrl}/api/orders`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // 🔸 Create Razorpay order
  const createOrder = async ({ amount, receipt }) => {
    const response = await api.post('/create', { amount, receipt });
    return response.data; // { order: {...} }
  };

  // 🔸 Verify Razorpay payment and place order
  const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, items, address }) => {
    const response = await api.post('/verify', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      items,
      address,
    });
    return response.data; // { message, order }
  };

  // 🔸 Get all orders of the current user
  const getUserOrders = async () => {
    const response = await api.get('/my-orders');
    return response.data; // [orders]
  };

  // 🔸 Get a single order by ID
  const getOrderById = async (orderId) => {
    const response = await api.get(`/${orderId}`);
    return response.data; // { order }
  };

  return {
    createOrder,
    verifyPayment,
    getUserOrders,
    getOrderById,
  };
};

export default useOrderServices;
