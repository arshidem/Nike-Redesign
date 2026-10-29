import { prepareMediaData } from "../../../utils/uploadMedia";
// src/features/product/services/reviewServices.jsx
import axios from "axios";
import { useAppContext } from "../../../context/AppContext";

export const useReviewServices = () => {
  const { backendUrl, token } = useAppContext();
  const API = `${backendUrl}/api/reviews`;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ✅ Add a new review
 // ✅ Add a new review with optional images
const addReview = async (productId, reviewData, images = []) => {
  const formData = new FormData();
  formData.append("product", productId);
  formData.append("rating", reviewData.rating);
  formData.append("comment", reviewData.comment);

  images.forEach((file) => {
    formData.append("images", file);
  });

  const res = await axios.post(API, await prepareMediaData(formData, token, "review"), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.data;
};


  // ✅ Get all reviews for a product
  const getReviewsByProduct = async (productId) => {
    const res = await axios.get(`${API}/${productId}`);
    return res.data;
  };

  // ✅ Update review by ID
  const updateReview = async (id, updatedData) => {
    const res = await axios.put(`${API}/${id}`, updatedData, { headers });
    return res.data;
  };

  // ✅ Delete review by ID
  const deleteReview = async (id) => {
    const res = await axios.delete(`${API}/${id}`, { headers });
    return res.data;
  };

  // ✅ Admin: Get all reviews (optional)
  const getAllReviews = async () => {
    const res = await axios.get(API, { headers });
    return res.data;
  };

return {
  addReview, // now accepts (productId, { rating, comment }, [files])
  getReviewsByProduct,
  updateReview,
  deleteReview,
  getAllReviews,
};

};
