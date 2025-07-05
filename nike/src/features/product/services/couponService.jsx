import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

export const useCouponService = () => {
  const { backendUrl, token } = useAppContext();

  const api = axios.create({
    baseURL: `${backendUrl}/api/coupons`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const fetchCoupons = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`?${query}`);
    return response.data;
  };

  const createCoupon = async (couponData) => {
    const response = await api.post("/", couponData);
    return response.data;
  };

  const updateCoupon = async (couponId, updatedData) => {
    const response = await api.put(`/${couponId}`, updatedData);
    return response.data;
  };

  const deleteCoupon = async (couponId) => {
    const response = await api.delete(`/${couponId}`);
    return response.data;
  };

  return {
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
  };
};
