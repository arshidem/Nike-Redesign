import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import Loader from "../../../shared/ui/Loader";
import { EditIcon, XIcon } from "../../../shared/ui/Icons";
import { useProductService } from "../../product/services/productService";
import toast, { Toaster } from "react-hot-toast";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TimelineChart = ({ data, lines }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
const AdminProductDetails = () => {
  const { slug } = useParams();
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const { fetchProductBySlug, deleteProduct } = useProductService();
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProductBySlug(slug);
        if (!data) throw new Error("Product not found");
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);
  const handleDeleteProduct = (id) => {
    toast.custom((t) => (
      <div className="bg-white shadow-lg rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-sm">
        <span className="text-black text-sm">
          Are you sure you want to delete this product?
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 text-sm rounded"
          >
            No
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteProduct(id);
                toast.success("Product deleted successfully");
                navigate("/admin#products"); // ✅ redirect after delete

                // Refresh list or update state
              } catch {
                toast.error("Failed to delete product");
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded"
          >
            Yes
          </button>
        </div>
      </div>
    ));
  };
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  const getMainImage = () => {
    if (product?.featuredImg) return formatImageUrl(product.featuredImg);
    if (product?.variants?.[0]?.images?.[0]) {
      return formatImageUrl(product.variants[0].images[0]);
    }
    return "/placeholder.jpg";
  };

  const calculateTotalStock = () => {
    return (
      product?.variants?.reduce((total, variant) => {
        return (
          total +
            variant.sizes?.reduce((sum, size) => sum + (size.stock || 0), 0) ||
          0
        );
      }, 0) || 0
    );
  };

  const handleImageError = (e) => {
    e.target.src = "/placeholder.jpg";
    e.target.className =
      "w-full h-auto max-h-96 object-contain p-4 bg-gray-100";
  };

  const renderBadges = (badges) => {
    if (!badges || badges.length === 0) return "-";
    return (
      <div className="flex flex-wrap gap-1">
        {badges.map((badge, index) => (
          <span key={index} className="bg-gray-100 px-2 py-1 text-xs rounded">
            {badge}
          </span>
        ))}
      </div>
    );
  };

  const renderTags = (tags) => {
    if (!tags || tags.length === 0) return "-";
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded"
          >
            {tag.name || tag}
          </span>
        ))}
      </div>
    );
  };
  const ProductAnalyticsModal = ({ product, onClose }) => {
    if (!product) return null;

    const [range, setRange] = useState("month");

    const filterTimeline = (timeline, range) => {
      const now = new Date();
      return timeline.filter((item) => {
        const itemDate = new Date(item.date);
        if (range === "today") {
          return itemDate.toDateString() === now.toDateString();
        } else if (range === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return itemDate >= weekAgo;
        } else if (range === "month") {
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        } else if (range === "year") {
          return itemDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    };

    const formatChartData = (timeline) => {
      return timeline.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        ...item,
      }));
    };

    const filteredTimeline = filterTimeline(
      product.timelineSummary?.soldTimeline || [],
      range
    );
    const soldData = formatChartData(filteredTimeline);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl mx-4 sm:mx-6 p-4 sm:p-6 relative shadow-lg max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black p-1"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
          </button>

          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Product Analytics
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">Views</p>
              <p className="text-lg font-semibold">
                {product.statistics?.views || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">Sold Units</p>
              <p className="text-lg font-semibold">
                {product.statistics?.sold || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">Wishlist Count</p>
              <p className="text-lg font-semibold">
                {product.statistics?.wishlist || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">Added to Cart (units)</p>
              <p className="text-lg font-semibold">
                {product.statistics?.totalInCart || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-600">Average Rating</p>
              <p className="text-lg font-semibold">
{product.rating.average?.toFixed(1) || "0.0"}
              </p>
            </div>
          </div>

          {/* Timeline Filter + Chart */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-semibold">Sold Units Timeline</h3>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* ✅ Total Sales Display */}
            <p className="text-sm mb-2 text-gray-700">
              Total Units Sold:{" "}
              <span className="font-semibold">
                {filteredTimeline.reduce(
                  (acc, item) => acc + item.unitsSold,
                  0
                )}
              </span>
            </p>

            <TimelineChart
              data={soldData}
              lines={[
                {
                  dataKey: "unitsSold",
                  color: "#82ca9d",
                },
              ]}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <Loader />;
  if (error) return <div className="p-4 text-center">Error: {error}</div>;
  if (!product) return <div className="p-4 text-center">Product not found</div>;

  return (
    <div>
      {showAnalytics && (
        <ProductAnalyticsModal
          product={product}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* Header with back button */}
      <div className="fixed bg-white p-2 w-full shadow flex items-center z-10">
        <button
          onClick={() => navigate(`/admin#products`)}
          className="px-3 py-1 mb-2 sm:px-4 sm:py-2 border border-black rounded hover:bg-gray-200 transition sm:w-auto flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4 transition-transform duration-300 rotate-180"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div className="max-w-7xl mx-auto sm:pt-14 pt-12">
        {/* Product header with actions */}
        <div className="bg-white rounded border p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{product.name}</h1>
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="block sm:inline-block sm:mr-4">
                  Slug: {product.slug}
                </span>
                <span className="block sm:inline-block sm:mr-4">
                  ID: {product._id}
                </span>
                {product.model && (
                  <span className="block sm:inline-block">
                    Model: {product.model}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAnalytics(true)}
                className="text-sm px-3 py-1 sm:px-4 sm:py-2 border-black border rounded-full hover:bg-gray-200 transition w-full sm:w-auto"
              >
                View Analytics
              </button>

              <button
                onClick={() =>
                  navigate(`/admin/product/update/${product.slug}`)
                }
                className="fixed right-2 bottom-2 text-sm px-3 py-3 sm:px-3 sm:py-3 border  border-black rounded-full  hover:bg-gray-800 transition text-white bg-black"
              >
                <EditIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDeleteProduct(product._id)}
                className="text-sm px-3 py-3 sm:px-3 sm:py-3 border  border-black rounded-full  hover:bg-gray-800 transition text-white bg-black"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("variants")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "variants"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Variants
              </button>
              <button
                onClick={() => setActiveTab("seo")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "seo"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                SEO
              </button>
            </nav>
          </div>

          {/* Main content area */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Product Image */}
              <div className="border rounded overflow-hidden">
                <img
                  src={getMainImage()}
                  alt={product.name}
                  className="w-full h-auto max-h-96 object-contain"
                  onError={handleImageError}
                />
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h2 className="text-lg font-semibold border-b pb-2 mb-3">
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium">{product.category || "-"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Gender</p>
                      <p className="font-medium capitalize">
                        {product.gender || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-medium">
                        ₹{product.price?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Discount</p>
                      <p className="font-medium">
                        {product.discountPercentage || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Price</p>
                      <p className="font-medium">
                        ₹{product.finalPrice?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Stock</p>
                      <p className="font-medium">{calculateTotalStock()}</p>
                    </div>

                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium capitalize">
                        {product.status || "active"}
                      </p>
                    </div>
                    {product.activityType && (
                      <div>
                        <p className="text-gray-600">Activity Type</p>
                        <p className="font-medium capitalize">
                          {product.activityType}
                        </p>
                      </div>
                    )}
                    {product.sportType && (
                      <div>
                        <p className="text-gray-600">Sport Type</p>
                        <p className="font-medium capitalize">
                          {product.sportType}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Description */}
                <div>
                  <div className="mb-6 border-b">
                    <h2 className="text-lg font-semibold pb-2 ">Description</h2>
                    <p className="text-sm whitespace-pre-line">
                      {product.description || "No description available"}
                    </p>
                  </div>
                  <div className="border-b">
                    <h2 className="text-lg font-semibold pb-2 mb-3">
                      Product Details
                    </h2>
                    <pre className="text-sm whitespace-pre-line">
                      {product.productDetails || "No description available"}
                    </pre>
                  </div>
                </div>

                {/* Flags */}
                <div>
                  <h2 className="text-lg font-semibold border-b pb-2 mb-3">
                    Flags
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.isFeatured || false}
                        readOnly
                        className="h-4 w-4"
                      />
                      <label>Featured</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.isTrending || false}
                        readOnly
                        className="h-4 w-4"
                      />
                      <label>Trending</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.isNewArrival || false}
                        readOnly
                        className="h-4 w-4"
                      />
                      <label>New Arrival</label>
                    </div>
                  </div>
                </div>

                {/* Tags & Badges */}
                <div>
                  <h2 className="text-lg font-semibold border-b pb-2 mb-3">
                    Tags & Badges
                  </h2>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tags</p>
                      {renderTags(product.tags)}
                    </div>
                    <div>
                      <p className="text-gray-600">Badges</p>
                      {renderBadges(product.badges)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "variants" && (
            <div className="bg-white rounded border">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">
                Product Variants
              </h2>
              {product.variants?.length > 0 ? (
                <div className="space-y-4">
                  {product.variants.map((variant, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Variant Images */}
                        <div className="md:w-1/3">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-6 h-6 rounded-full border"
                              style={{
                                backgroundColor: variant.color.toLowerCase(),
                              }}
                              title={variant.color}
                            />
                            <h3 className="font-medium capitalize">
                              {variant.color}
                            </h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              SKU: {variant.sku || "N/A"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {variant.images?.map((img, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={formatImageUrl(img)}
                                  alt={`${variant.color} variant`}
                                  className="w-full h-full object-cover border rounded"
                                  onError={handleImageError}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Variant Sizes */}
                        <div className="md:w-2/3">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Available Sizes</h4>
                            <span className="text-sm text-gray-600">
                              Total Stock:{" "}
                              {variant.sizes?.reduce(
                                (sum, size) => sum + (size.stock || 0),
                                0
                              )}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {variant.sizes?.map((size, sizeIndex) => (
                              <div
                                key={sizeIndex}
                                className={`border p-3 rounded text-sm ${
                                  size.stock === 0 ? "bg-red-50" : "bg-white"
                                }`}
                              >
                                <p className="font-medium">Size: {size.size}</p>
                                <p
                                  className={
                                    size.stock === 0 ? "text-red-500" : ""
                                  }
                                >
                                  Stock: {size.stock}
                                </p>
                                {size.price && (
                                  <p className="text-gray-600">
                                    Price: ₹{size.price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No variants available for this product
                </div>
              )}
            </div>
          )}

          {activeTab === "seo" && (
            <div className="bg-white rounded border p-4">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">
                SEO Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Meta Title</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {product.meta?.title || product.name}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Meta Description</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded whitespace-pre-line">
                    {product.meta?.description || "No meta description set"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">SEO Keywords</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {product.seoKeywords?.join(", ") || "No keywords set"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Canonical URL</h3>
                  <p className="text-sm bg-gray-50 p-3 rounded break-all">
                    {product.canonicalUrl || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetails;
