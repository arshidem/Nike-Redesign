import axios from 'axios';
import { useAppContext } from '../../../context/AppContext';

export const useProductService = () => {
  const { backendUrl,token } = useAppContext();

  // 🔍 Fetch all products with optional filters
const fetchProducts = async (filters = {}) => {
  try {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== undefined && value !== '' && value !== null
      )
    );

    const response = await axios.get(`${backendUrl}/api/products`, {
      params: cleanedFilters,
    });
    return response.data;
  } catch (err) {
    console.error("Failed to fetch products", err);
    return [];
  }
};


  // 🔍 Fetch a single product by slug
const fetchProductBySlug = async (slug) => {
  try {
    const response = await axios.get(`${backendUrl}/api/products/${slug}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch product by slug", err);
    return null;
  }
};
const fetchProductById = async (id) => {
  try {
    const response = await axios.get(`${backendUrl}/api/products/id/${id}`);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch product by id", err);
    return null;
  }
};


  // 🔝 Fetch top-selling products
  const fetchTopProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/products/top`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch top products", err);
      return [];
    }
  };

  // ➕ Create a new product (admin only)
  const createProduct = async (formData) => {
    try {
      const response = await axios.post(`${backendUrl}/api/products`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      return response.data;
    } catch (err) {
      console.error("Failed to create product", err);
      throw err;
    }
  };

  // ✏️ Update a product (admin only)
// ✏️ Update a product (admin only)
const updateProduct = async (slug, formDataToSend, token) => {
  try {
    const response = await axios.put(
      `${backendUrl}/api/products/${slug}`,
      formDataToSend,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to update product", err);
    throw err;
  }
};

  // ❌ Delete a product (admin only)
  const deleteProduct = async (id) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/products/${id}`, {
         headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
        
      });
      return response.data;
    } catch (err) {
      console.error("Failed to delete product", err);
      throw err;
    }
  };

  // 🔍 Fetch filter options (categories, genders, models, etc.)
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/products/filter-options`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch filter options", err);
      return {};
    }
  };

  return {
    fetchProducts,
    fetchProductBySlug,
    fetchTopProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchFilterOptions, // ✅ Make sure this is included
    fetchProductById,
  };
};
