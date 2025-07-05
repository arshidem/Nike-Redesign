import React, { useEffect, useState } from "react";
import { useProductService } from "../../product/services/productService";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import Loader from "../../../shared/ui/Loader";
import { HomeIcon, PlusIconWhite,XIcon } from "../../../shared/ui/Icons";



export const AllProducts = () => {
  const { fetchProducts, fetchFilterOptions } = useProductService();
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    genders: [],
    models: [],
    activityTypes: [],
    sportTypes: [],
    colors: [],
    sizes: [],
    sizesByCategory: {},
  });

  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [model, setModel] = useState("");
  const [activityType, setActivityType] = useState("");
  const [sportType, setSportType] = useState("");
  const [minRating, setMinRating] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minDiscount, setMinDiscount] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const [products, setProducts] = useState(() => {
    const loadInitialProducts = async () => {
      try {
        const initialProducts = await fetchProducts({});
        return initialProducts;
      } catch (err) {
        console.error("Error loading initial products:", err);
        return [];
      }
    };

    loadInitialProducts().then((products) => setProducts(products));
    return [];
  });

  const handleRefresh = () => {
    setRefreshTrigger((prev) => !prev);
  };

  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  const sizeMap = filterOptions.sizesByCategory || {};

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const opts = await fetchFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        console.error("Error loading filter options:", err);
      } finally {
        setLoadingFilters(false);
      }
    };
    loadFilterOptions();
  }, [fetchFilterOptions]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters = {
        category,
        gender,
        model,
        activityType,
        sportType,
        minRating,
        minPrice,
        maxPrice,
        minDiscount,
        isFeatured: isFeatured ? true : undefined,
        isTrending: isTrending ? true : undefined,
        newArrival: isNewArrival ? true : undefined,
        search: searchTerm,
        color: selectedColor,
        size: selectedSize,
        sortBy: sortKey || undefined,
      };

      const data = await fetchProducts(filters);
      setProducts(data);
      setShowFilters(false);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setCategory("");
    setGender("");
    setModel("");
    setActivityType("");
    setSportType("");
    setMinRating("");
    setMinPrice("");
    setMaxPrice("");
    setMinDiscount("");
    setIsFeatured(false);
    setIsTrending(false);
    setIsNewArrival(false);
    setSearchTerm("");
    setSortKey("");
    setSelectedColor("");
    setSelectedSize("");
    loadProducts();
    handleRefresh();
  };
  const handleProductClick = (slug) => {
    navigate(`/admin/product/${slug}`, { state: { fromView: "products" } });
  };

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  const getProductImage = (product) => {
    const firstImage = product?.variants?.[0]?.images?.[0];
    return firstImage ? formatImageUrl(firstImage) : "/placeholder.jpg";
  };

  const getSortIcon = (key) => {
    if (sortKey === key) return "↑";
    if (sortKey === `-${key}`) return "↓";
    return "";
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortKey(`-${key}`);
    else if (sortKey === `-${key}`) setSortKey("");
    else setSortKey(key);
  };

  if (loadingFilters) return <Loader/>;

  return (
    <div className="p-4">
<div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 w-full">
  {/* Search + Filter group */}
  <div className="flex gap-4 w-full">
    {/* Search Input - grows on sm+ */}
    <div className="relative flex-grow sm:flex-grow">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full text-xs sm:text-xs sm:text-xs sm:text-sm pl-3 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
        onKeyDown={(e) => e.key === "Enter" && loadProducts()}
      />
      <button
        onClick={loadProducts}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
    </div>

    {/* Filter Button */}
    <button
      onClick={() => setShowFilters(!showFilters)}
      className="p-2 rounded hover:bg-gray-200 transition shrink-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
        />
      </svg>
    </button>
    <button
  onClick={handleRefresh}
  className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
</button>
      

  </div>
  {/* New Product Button */}
  <button
    onClick={() => navigate("/admin/create-product")}
    className="flex items-center justify-center bg-black gap-2  border  rounded hover:bg-gray-500 transition w-full py-2 sm:w-44 text-xs sm:text-xs sm:text-xs sm:text-sm"
  >
    <PlusIconWhite/>
    <span className="text-white">New Product</span>
  </button>
</div>


      {/* Filters Modal */}
       {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs sm:text-xs sm:text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-xs sm:text-sm"
                  >
                    <option value="">All Categories</option>
                    {filterOptions.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">All Genders</option>
                    {filterOptions.genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">All Models</option>
                    {filterOptions.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity Type Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Activity Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">All Activity Types</option>
                    {filterOptions.activityTypes.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sport Type Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Sport Type
                  </label>
                  <select
                    value={sportType}
                    onChange={(e) => setSportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">All Sport Types</option>
                    {filterOptions.sportTypes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Rating Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Min Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">Any Rating</option>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>
                        {r} ★ & up
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Discount Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Min Discount
                  </label>
                  <select
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">Any Discount</option>
                    {[5, 10, 20, 30, 40, 50].map((d) => (
                      <option key={d} value={d}>
                        {d}% or more
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min ₹"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max ₹"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">Default</option>
                    <option value="sold">Top Sold</option>
                    <option value="priceAsc">Price ↑</option>
                    <option value="priceDesc">Price ↓</option>
                  </select>
                </div>

                {/* Color Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    Color
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm"
                  >
                    <option value="">All Colors</option>
                    {filterOptions?.colors?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!category}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs sm:text-sm disabled:opacity-50"
                  >
                    <option value="">All Sizes</option>
                    {sizeMap[category]?.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox Filters */}
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="text-xs sm:text-sm">
                    Featured
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="trending"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="trending" className="text-xs sm:text-sm">
                    Trending
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="newArrival"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="newArrival" className="text-xs sm:text-sm">
                    New Arrival
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={loadProducts}
                  disabled={loading}
                  className={`px-6 py-2 rounded text-white text-xs sm:text-sm ${
                    loading ? "bg-gray-500" : "bg-black hover:bg-gray-800"
                  }`}
                >
                  {loading ? "Applying..." : "Apply Filters"}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 rounded border border-gray-300 text-xs sm:text-sm hover:bg-gray-100"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50 text-xs sm:text-xs sm:text-sm">
            <tr>
              <th
                className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer text-xs sm:text-xs sm:text-sm"
                onClick={() => handleSort("name")}
              >
                Product {getSortIcon("name")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("gender")}
              >
                Gender {getSortIcon("gender")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Price {getSortIcon("price")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("finalPrice")}
              >
                Final Price {getSortIcon("finalPrice")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("rating")}
              >
                Rating {getSortIcon("rating")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("sold")}
              >
                Sold {getSortIcon("sold")}
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-xs sm:text-sm font-medium text-gray-700">
                Colors
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length > 0 ? (
              products.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => handleProductClick(product.slug)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border border-gray-200">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                            e.target.className =
                              "h-full w-full object-contain p-2 bg-gray-100";
                          }}
                        />
                      </div>
                      <div className="ml-3">
                        <div className="text-xs sm:text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">
                          {product.name}
                        </div>
                        <div className="text-xs sm:text-xs sm:text-sm text-gray-500 mt-1">
                          ID: {product._id}
                        </div>
                        {product.model && (
                          <div className="text-xs sm:text-xs sm:text-sm text-gray-500 mt-1">
                            Model: {product.model}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm text-gray-700 capitalize">
                    {product.gender}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm text-gray-700">
                    ₹{product.price?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm font-medium text-gray-700">
                    ₹{product.finalPrice?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm text-gray-700">
                    <div className="flex items-center">
                      <div className="font-medium">
                        {product.rating?.toFixed(1) || "0.0"}
                      </div>
                      <div className="ml-1">⭐</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm text-gray-700">
                    {product.sold?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-xs sm:text-sm">
                    <div className="flex flex-wrap gap-1">
                      {product.variants?.map((variant, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: variant.color.toLowerCase(),
                          }}
                          title={variant.color}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-xs sm:text-xs sm:text-sm text-gray-500">
                  No products found. Try adjusting your filters.
                   <button
                        onClick={resetFilters}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Clear filters
                      </button>
                </td>
                
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
