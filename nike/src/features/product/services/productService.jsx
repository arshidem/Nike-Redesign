import axios from 'axios';
import { useAppContext } from '../../../context/AppContext';

export const useProductService = () => {
  const { backendUrl, token } = useAppContext();

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

    // Return both products and pagination data
    return {
      products: response.data.products || [],
      pagination: response.data.pagination || {},
    };
  } catch (err) {
    console.error("Failed to fetch products", err);
    return {
      products: [],
      pagination: { totalItems: 0, totalPages: 0, currentPage: 1 },
    };
  }
};
// 📈 Fetch best sellers based on monthly sales
const fetchBestSellers = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/products/best-sellers`);
    return response.data.bestSellers || [];
  } catch (err) {
    console.error("Failed to fetch best sellers", err);
    return [];
  }
};

  // ⭐ Fetch featured products
const fetchFeaturedProducts = async () => {
  try {
    const url = `${backendUrl}/api/products/featured`;
    console.log("Calling:", url); // 👈 log this
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch featured products", err);
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

  // 🔍 Fetch a single product by ID
  const fetchProductById = async (id) => {
    try {
      const response = await axios.get(`${backendUrl}/api/products/id/${id}`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch product by id", err);
      return null;
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
 const bulkDeleteProducts = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No product IDs provided for bulk delete");
    }
    try {
      const response = await axios.delete(
        `${backendUrl}/api/products/bulk-delete`,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          data: { ids },
          withCredentials: true,
        }
      );
      return response.data; // { success: true, deletedCount, message }
    } catch (err) {
      console.error("Failed to bulk-delete products", err);
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
  // 📊 Fetch product analytics
  const fetchProductAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/products/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (err) {
      console.error("Failed to fetch product analytics", err);
      return null;
    }
  };

const getProductSuggestions = async (productSlug, token) => {
  try {
    const res = await axios.get(`${backendUrl}/api/products/${productSlug}/suggestions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch product suggestions", err);
    return [];
  }
};


  return {
    fetchProducts,
    fetchProductBySlug,
    fetchFeaturedProducts, // ✅ Added here
    fetchBestSellers,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchFilterOptions,
    fetchProductById,
    fetchProductAnalytics,
    bulkDeleteProducts,
    getProductSuggestions
  };
};
