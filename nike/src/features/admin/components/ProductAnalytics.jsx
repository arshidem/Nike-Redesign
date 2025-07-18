import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useProductService } from "../../product/services/productService";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DFF",
  "#FF6B6B",
];

const formatImageUrl = (imagePath, backendUrl) => {
  if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
  const match = imagePath.match(
    /uploads[\\/][\w\-.]+\.(jpg|jpeg|png|webp|avif)/i
  );
  const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
  return `${backendUrl}/${relativePath}`;
};

const ProductAnalytics = () => {
  const { fetchProductAnalytics } = useProductService();
  const [data, setData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingGender, setLoadingGender] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingCold, setLoadingCold] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { backendUrl } = useAppContext();

  // State for time period filters
  const [trendingPeriod, setTrendingPeriod] = useState("week");
  const [coldPeriod, setColdPeriod] = useState("month");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        setLoadingSummary(true);
        setLoadingCategory(true);
        setLoadingGender(true);
        setLoadingTrending(true);
        setLoadingCold(true);
        setError(null);

        const res = await fetchProductAnalytics();
        if (!isMounted) return;

        setData(res);

        // Set loaders off for each section (optional: based on actual data)
        setLoadingSummary(false);
        setLoadingCategory(false);
        setLoadingGender(false);
        setLoadingTrending(false);
        setLoadingCold(false);
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load analytics data");
          setLoadingSummary(false);
          setLoadingCategory(false);
          setLoadingGender(false);
          setLoadingTrending(false);
          setLoadingCold(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProductClick = (slug) => {
    navigate(`/admin/product/${slug}`, { state: { fromView: "analytics" } });
  };

  const handleStockDetailsClick = () => {
    navigate("/admin/stock-details");
  };
  // In your ProductAnalytics component, update the processedData memo:
  const processedData = useMemo(() => {
    if (!data) return null;

    // Get the correct trending products based on selected period
    const getTrendingProducts = () => {
      if (!data.trendingProducts) return [];

      if (
        typeof data.trendingProducts === "object" &&
        !Array.isArray(data.trendingProducts)
      ) {
        // New format with time periods
        return data.trendingProducts[trendingPeriod] || [];
      }

      // Fallback to old array format
      return Array.isArray(data.trendingProducts)
        ? data.trendingProducts.slice(0, 5)
        : [];
    };

    // Get total units sold for display
    const getTotalUnitsSold = () => {
      if (typeof data.totalUnitsSold === "object") {
        // Return the allTime count if available, or sum all periods
        return (
          data.totalUnitsSold.allTime ||
          Object.values(data.totalUnitsSold).reduce((sum, val) => sum + val, 0)
        );
      }
      return data.totalUnitsSold || 0;
    };

    return {
      ...data,
      categoryBreakdown: Array.isArray(data.categoryBreakdown)
        ? data.categoryBreakdown
        : [],
      genderBreakdown: Array.isArray(data.genderBreakdown)
        ? data.genderBreakdown
        : [],
      trendingProducts: getTrendingProducts(),
      coldProducts: Array.isArray(data.coldProducts)
        ? data.coldProducts.slice(0, 5)
        : [],
      totalUnitsSold: getTotalUnitsSold(),
    };
  }, [data, trendingPeriod, coldPeriod]);

  const {
    totalProducts = 0,
    totalVariants = 0,
    totalUnitsSold = 0,
    totalReviews = 0,
    categoryBreakdown = [],
    genderBreakdown = [],
} = processedData || {};

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {loadingSummary ? (
    [...Array(4)].map((_, i) => <Skeleton key={i} height={80} />)
  ) : (
    <>
<SummaryCard label="Total Products" value={processedData?.totalProducts || 0} />
      <SummaryCard label="Total Variants" value={totalVariants} />
      <SummaryCard label="Total Sold" value={totalUnitsSold} />
      <SummaryCard label="Total Reviews" value={totalReviews} />
    </>
  )}
</div>


  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading Analytics
        </h2>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-semibold text-yellow-600">
          No Data Available
        </h2>
        <p className="text-yellow-700">
          There is no analytics data to display.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-white text-black">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Analytics</h2>
        <button
          onClick={handleStockDetailsClick}
          className="px-4 py-2 bg-black text-white rounded hover:opacity-90 transition"
        >
          View Stock Details
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Products" value={totalProducts} />
        <SummaryCard label="Total Variants" value={totalVariants} />
        <SummaryCard label="Total Sold" value={totalUnitsSold} />
        <SummaryCard label="Total Reviews" value={totalReviews} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Category Breakdown">
          {loadingCategory ? (
            <Skeleton height={300} />
          ) : categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} products`, "Count"]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No category data available</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Gender Breakdown">
          {loadingGender ? (
            <Skeleton height={300} />
          ) : genderBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genderBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="gender"
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} products`, "Count"]}
                />
                <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No gender data available</p>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Trending Products</h4>
            <select
              value={trendingPeriod}
              onChange={(e) => setTrendingPeriod(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {loadingTrending ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={60} />
              ))}
            </div>
          ) : (
            <ProductList
              products={processedData.trendingProducts}
              onClick={handleProductClick}
              backendUrl={backendUrl}
              emptyMessage={`No trending products in the last ${trendingPeriod}`}
            />
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">❄️ Cold Products</h4>
            <select
              value={coldPeriod}
              onChange={(e) => setColdPeriod(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {loadingCold ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={60} />
              ))}
            </div>
          ) : (
            <ProductList
              products={processedData.coldProducts}
              onClick={handleProductClick}
              backendUrl={backendUrl}
              emptyMessage={`No cold products in the last ${coldPeriod}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components (keep these the same as before)
const SummaryCard = ({ label, value, icon, isWarning = false }) => (
  <div
    className={`bg-white shadow-md rounded-lg p-4 ${
      isWarning ? "border-l-4 border-yellow-500" : ""
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-gray-500 text-sm">{label}</p>
      <span className="text-lg">{icon}</span>
    </div>
    <h3
      className={`text-xl font-semibold ${
        isWarning ? "text-yellow-600" : "text-gray-800"
      }`}
    >
      {value.toLocaleString()}
    </h3>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white shadow-md rounded-lg p-4">
    <h4 className="font-medium text-gray-700 mb-4">{title}</h4>
    {children}
  </div>
);

const ProductList = ({
  title,
  products = [],
  emptyMessage = "No products found",
  onClick,
  backendUrl,
}) => (
  <div>
    {title && <h4 className="font-medium text-gray-700 mb-3">{title}</h4>}
    <ul className="space-y-3">
      {products.length > 0 ? (
        products.map((p) => (
          <li
            key={p._id}
            className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 p-2 rounded"
          >
            <img
              src={formatImageUrl(p.image, backendUrl)}
              alt={p.name}
              className="w-12 h-12 object-cover rounded-md cursor-pointer"
              onClick={() => onClick(p.slug)}
            />
            <div className="flex-1">
              <p
                className="text-sm font-medium cursor-pointer hover:text-blue-600"
                onClick={() => onClick(p.slug)}
              >
                {p.name}
              </p>
              <p className="text-xs text-gray-400">
                {p.views?.toLocaleString() || 0} views •{" "}
                {p.sold?.toLocaleString() || 0} sold
              </p>
            </div>
          </li>
        ))
      ) : (
        <li className="text-sm italic text-gray-400 py-2">{emptyMessage}</li>
      )}
    </ul>
  </div>
);

// PropTypes (keep these the same as before)
SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string,
  isWarning: PropTypes.bool,
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

ProductList.propTypes = {
  title: PropTypes.string,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      views: PropTypes.number,
      sold: PropTypes.number,
      slug: PropTypes.string,
      image: PropTypes.string,
    })
  ),
  emptyMessage: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  backendUrl: PropTypes.string.isRequired,
};

export default ProductAnalytics;
