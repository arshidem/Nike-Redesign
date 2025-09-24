import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import { useProductService } from "../../product/services/productService";
import { useWishlistService } from "../services/wishlistServices";
import {
  BackBar,
  HeartIcon,
  FilterIcon,
  XIcon,
} from "../../../shared/ui/Icons";
import Footer from "../components/Footer";
import { ModelSkeleton } from "../../../shared/ui/Skeleton";
import { toast } from "react-hot-toast";

const ModelPage = () => {
  const { modelName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const navigate = useNavigate();
  const { user, backendUrl } = useAppContext();
  const { fetchProducts, fetchFilterOptions } = useProductService();
  const { toggleWishlist, getWishlist } = useWishlistService();
  const [showFilters, setShowFilters] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [filters, setFilters] = useState({
    sortBy: "", // single selection
    gender: "", // single selection
    priceRange: [0, 10000], // range
    color: "", // single color selection
    minRating: "", // minimum rating filter
    minDiscount: "", // minimum discount filter
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [mobileFilters, setMobileFilters] = useState({
    sortBy: "",
    gender: "",
    priceRange: [0, 10000],
    color: "",
    minRating: "",
    minDiscount: "",
  });
  const clearAllFilters = () => {
    const min = priceRange[0];
    const max = priceRange[1];

    const clearedFilters = {
      sortBy: "",
      gender: "",
      priceRange: [min, max],
      color: "",
      minRating: "",
      minDiscount: "",
    };

    setFilters(clearedFilters);
    setMobileFilters(clearedFilters);
    setShowFilters(false);
  };
  useEffect(() => {
    setMobileFilters(filters);
  }, [filters]);
  const applyMobileFilters = () => {
    setFilters(mobileFilters);
    setShowFilters(false);
  };
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  console.log(products);

  // Extract available colors from products
  useEffect(() => {
    const processColorsFromProducts = () => {
      if (products.length > 0) {
        try {
          // Get unique colors from products' variants
          const colorSet = new Set();

          products.forEach((product) => {
            product.variants.forEach((variant) => {
              if (variant.color && typeof variant.color === "string") {
                const normalizedColor = variant.color
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "-");
                colorSet.add(normalizedColor);
              }
            });
          });

          const normalizedColors = Array.from(colorSet).sort();
          setAvailableColors(normalizedColors);

          const prices = products.map((p) => p.finalPrice || p.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setPriceRange([min, max]);
          setFilters((prev) => ({
            ...prev,
            priceRange: [min, max],
          }));
        } catch (error) {
          console.error("Error processing product colors:", error);
        }
      }
    };

    processColorsFromProducts();
  }, [products.length, modelName]); // Only depend on products.length and modelName
  // Fetch products with filters
  const fetchFilteredProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        model: decodeURIComponent(modelName),
      };

      // Apply all filters simultaneously
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.gender) params.gender = filters.gender;
      if (filters.priceRange[0] !== priceRange[0])
        params.minPrice = filters.priceRange[0];
      if (filters.priceRange[1] !== priceRange[1])
        params.maxPrice = filters.priceRange[1];
      if (filters.color) params.color = filters.color;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.minDiscount) params.minDiscount = filters.minDiscount;

      const { products: productList } = await fetchProducts(params);
      setProducts(productList);
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [filters, modelName]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [filters]);

  // Handle filter changes
  const handleSortChange = (value) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  };

  const handleGenderChange = (value) => {
    setFilters((prev) => ({ ...prev, gender: value }));
  };

  const handlePriceChange = (min, max) => {
    setFilters((prev) => ({ ...prev, priceRange: [min, max] }));
  };

  const handleRatingChange = (value) => {
    setFilters((prev) => ({ ...prev, minRating: value }));
  };

  const handleDiscountChange = (value) => {
    setFilters((prev) => ({ ...prev, minDiscount: value }));
  };

  // Fetch products and wishlist on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { products: productList } = await fetchProducts({
          model: decodeURIComponent(modelName),
        });
        setProducts(productList);

        if (user) {
          const response = await getWishlist();
          const wishlistProductIds = response.data.map(
            (product) => product._id
          );
          setWishlistIds(wishlistProductIds);
        }
      } catch (err) {
        console.error("Failed to load data", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [modelName, user]);

  const isInWishlist = (productId) => {
    return wishlistIds.includes(productId);
  };

const handleWishlistToggle = async (productId, e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!user) {
    // Custom toast with button to Sign In
 toast.custom(
  (t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="p-4 flex items-center justify-between w-full">
        <span className="text-sm font-medium text-gray-900">
          Please login to add items to your wishlist
        </span>
        <button
          onClick={() => {
            toast.dismiss(t.id); // close toast manually
            navigate("/signin"); // redirect
          }}
          className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
        >
          Sign In
        </button>
      </div>
    </div>
  ),
  {
    duration: 3000, // 5 seconds
  }
);

    return; // stop execution if user is not logged in
  }

  try {
    setWishlistLoading((prev) => ({ ...prev, [productId]: true }));

    const response = await toggleWishlist(productId);
    const updatedWishlistIds = response.wishlist.map((product) => product._id);
    setWishlistIds(updatedWishlistIds);

    toast.success(
      response.action === "added"
        ? "Added to wishlist!"
        : "Removed from wishlist!"
    );
  } catch (err) {
    console.error("Failed to toggle wishlist", err);
    toast.error(err.message || "Failed to update wishlist");
  } finally {
    setWishlistLoading((prev) => ({ ...prev, [productId]: false }));
  }
};


  // Render star rating display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">
          ☆
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ☆
        </span>
      );
    }

    return stars;
  };

  const FilterSection = ({ isMobile = false }) => {
    const currentFilters = isMobile ? mobileFilters : filters;
    const setCurrentFilters = isMobile ? setMobileFilters : setFilters;

    // Create handler functions using current filters
    const handleSortChange = (value) => {
      setCurrentFilters((prev) => ({ ...prev, sortBy: value }));
    };

    const handleGenderChange = (value) => {
      setCurrentFilters((prev) => ({ ...prev, gender: value }));
    };

    const handlePriceChange = (min, max) => {
      setCurrentFilters((prev) => ({ ...prev, priceRange: [min, max] }));
    };

    const handleRatingChange = (value) => {
      setCurrentFilters((prev) => ({ ...prev, minRating: value }));
    };

    const handleDiscountChange = (value) => {
      setCurrentFilters((prev) => ({ ...prev, minDiscount: value }));
    };

    const handleColorChange = (color) => {
      setCurrentFilters((prev) => ({ ...prev, color }));
    };

    return (
      <div className="space-y-6">
        {/* Sort By Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Sort By</h3>
          {[
            { value: "", label: "Featured" },
            { value: "newArrival", label: "Newest" },
            { value: "isTrending", label: "Trending" },
            { value: "priceAsc", label: "Price: Low-High" },
            { value: "priceDesc", label: "Price: High-Low" },
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3">
              <input
                type="radio"
                name="sortBy"
                checked={filters.sortBy === option.value}
                onChange={() => handleSortChange(option.value)}
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {/* Gender Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Gender</h3>
          {[
            { value: "", label: "All" },
            { value: "men", label: "Men" },
            { value: "women", label: "Women" },
            { value: "unisex", label: "Unisex" },
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3">
              <input
                type="radio"
                name="gender"
                checked={filters.gender === option.value}
                onChange={() => handleGenderChange(option.value)}
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {/* Color Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Color</h3>
          {availableColors.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {/* All Colors Option */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  checked={filters.color === ""}
                  onChange={() =>
                    setFilters((prev) => ({ ...prev, color: "" }))
                  }
                  className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="text-sm">All</span>
              </label>

              {/* Color Options */}
              {availableColors.map((color) => (
                <label
                  key={color}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="color"
                    checked={filters.color === color}
                    onChange={() => setFilters((prev) => ({ ...prev, color }))}
                    className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                  />
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2 border border-gray-300"
                      style={{
                        backgroundColor: color.includes("black")
                          ? "#000"
                          : color.includes("white")
                          ? "#fff"
                          : color.includes("red")
                          ? "#f00"
                          : color.includes("blue")
                          ? "#00f"
                          : color.includes("green")
                          ? "#0f0"
                          : color.includes("yellow")
                          ? "#ff0"
                          : color.includes("pink")
                          ? "#ffc0cb"
                          : color.includes("gray")
                          ? "#808080"
                          : "#ccc",
                      }}
                    ></span>
                    <span className="capitalize text-sm">
                      {color.replace(/-/g, " ")}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No color variants available
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Minimum Rating</h3>
          {[
            { value: "", label: "All Ratings" },
            { value: "4", label: "4★ & Above" },
            { value: "3", label: "3★ & Above" },
            { value: "2", label: "2★ & Above" },
            { value: "1", label: "1★ & Above" },
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === option.value}
                onChange={() => handleRatingChange(option.value)}
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
              />
              <span className="flex items-center">
                {option.value && (
                  <span className="mr-2">
                    {renderStars(parseInt(option.value))}
                  </span>
                )}
                {option.label}
              </span>
            </label>
          ))}
        </div>

        {/* Discount Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Minimum Discount</h3>
          {[
            { value: "", label: "All Products" },
            { value: "10", label: "10% & Above" },
            { value: "20", label: "20% & Above" },
            { value: "30", label: "30% & Above" },
            { value: "40", label: "40% & Above" },
            { value: "50", label: "50% & Above" },
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3">
              <input
                type="radio"
                name="discount"
                checked={filters.minDiscount === option.value}
                onChange={() => handleDiscountChange(option.value)}
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Price Range</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
            <div className="flex space-x-4">
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={filters.priceRange[0]}
                onChange={(e) =>
                  handlePriceChange(
                    Number(e.target.value),
                    filters.priceRange[1]
                  )
                }
                className="w-full"
              />
              <input
                type="range"
                min={priceRange[0]}
                max={priceRange[1]}
                value={filters.priceRange[1]}
                onChange={(e) =>
                  handlePriceChange(
                    filters.priceRange[0],
                    Number(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 relative">
      <BackBar />

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold mb-2 mt-10">
          {decodeURIComponent(modelName)} ({products.length})
        </h1>
        <button
          onClick={toggleFilters}
          className="md:hidden flex items-center gap-2 p-2 border rounded-lg mt-10 bg-white shadow-sm hover:bg-gray-50"
        >
          <FilterIcon className="w-5 h-5" />
          <span>Filters</span>
        </button>
        {!isMobile && (
          <button
            className="flex items-center gap-2 p-2 border rounded-lg mt-10 bg-white shadow-sm hover:bg-gray-50"
            onClick={toggleFilters}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <div
        className={`fixed inset-0 z-30 transform ${
          showFilters ? "translate-y-0" : "translate-y-full"
        } transition-transform duration-300 ease-in-out bg-white p-6 overflow-y-auto md:hidden`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={toggleFilters}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <FilterSection />

        <div className="flex gap-4 mt-8">
          <button
            onClick={clearAllFilters}
            className="flex-1 py-3 bg-gray-200 text-black rounded-md font-medium"
          >
            Clear Filters
          </button>
          <button
            onClick={applyMobileFilters}
            className="flex-1 py-3 bg-black text-white rounded-md font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Desktop Filter Sidebar */}
      {!isMobile && (
        <div
          className={`hidden md:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-20 p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out
      ${showFilters ? "translate-x-0" : "-translate-x-full"}
    `}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl mt-14 font-bold">Filters</h2>
          </div>

          <FilterSection />
        </div>
      )}

      {/* Main Content */}
      <div
        className={`${
          showFilters ? "md:ml-64" : ""
        } transition-all duration-300`}
      >
        {loading ? (
          <ModelSkeleton />
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-5 mt-1">
              <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {products.map((product) => {
                  const rawImage = product?.variants?.[0]?.images?.[0];
                  const image = formatImageUrl(rawImage);
                  const isLoading = wishlistLoading[product._id];
                  const isWishlisted = isInWishlist(product._id);

                  return (
                    <Link
                      to={`/product/${product.slug}`}
                      key={product._id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition block p-4 relative"
                    >
                      <button
                        onClick={(e) => handleWishlistToggle(product._id, e)}
                        className={`absolute top-6 right-6 p-1 rounded-full shadow ${
                          isWishlisted ? "bg-red-50" : "bg-white"
                        }`}
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <svg
                            className="animate-spin h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <HeartIcon
                            className={`h-6 w-6 ${
                              isWishlisted
                                ? "fill-red-600 stroke-none"
                                : "fill-none stroke-black"
                            }`}
                          />
                        )}
                      </button>

                      {/* Product badges */}
                      <div className="absolute top-6 left-6 flex flex-col gap-1">
                        {product.createdAt &&
                          new Date(product.createdAt) >
                            new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                              New
                            </span>
                          )}
                        {product.isTrending && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                            Trending
                          </span>
                        )}
                        {product.discountPercentage > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {product.discountPercentage}% OFF
                          </span>
                        )}
                      </div>

                      <img
                        src={image}
                        alt={product.name}
                        className="w-full object-contain mb-4"
                        loading="lazy"
                      />
                      <span className="text-red-600 font-semibold text-sm">
                        {product.tag}
                      </span>
                      <h2 className="text-sm font-semibold">{product.name}</h2>
                      <p className="text-gray-500 text-sm">
                        {product.gender.charAt(0).toUpperCase() +
                          product.gender.slice(1)}
                      </p>

                      {/* Rating display */}
                      {product.rating && product.rating.total > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex">
                            {renderStars(product.rating.average)}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({product.rating.total})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-700 font-medium">
                          MRP : ₹{" "}
                          {(
                            product.finalPrice || product.price
                          )?.toLocaleString()}
                        </p>
                        {product.finalPrice &&
                          product.finalPrice < product.price && (
                            <p className="text-gray-500 line-through text-sm">
                              ₹{product.price?.toLocaleString()}
                            </p>
                          )}
                      </div>
                    </Link>
                  );
                })}
                {products.length === 0 && (
                  <p>No products found in this model.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ModelPage;
