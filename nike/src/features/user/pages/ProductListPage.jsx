import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import { toast } from "react-hot-toast";
import { useWishlist } from "../../../hooks/useWishlist";
import { HeartIcon, StarIcon, FilterIcon, XIcon } from "../../../shared/ui/Icons";
import { ModelSkeleton } from "../../../shared/ui/Skeleton";
import { BackBar } from "../../../shared/ui/Icons";
import Footer from "../components/Footer";
import useWindowSize from "../../../hooks/useWindowSize";

const ProductListPage = ({ title = "All Products" }) => {
const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    genders: [],
    models: [],
    activityTypes: [],
    sportTypes: [],
    colors: [],
    sizes: [],
    sizesByCategory: {}
  });
  const { fetchProducts, fetchFilterOptions } = useProductService();
  const { backendUrl, user } = useAppContext();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Wishlist functionality
  const { wishlistIds, wishlistLoading, isInWishlist, handleWishlistToggle } =
    useWishlist(user);

  // Filter state
  const [filters, setFilters] = useState({
    sortBy: "",
    gender: "",
    color: "",
    minRating: "",
    minDiscount: "",
    priceRange: [0, 1000],
    category: [],
    model: [],
    sportType: [],
    activityType: [],
    size: [],
  });
  
  const [mobileFilters, setMobileFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Extract query parameters
const queryParams = new URLSearchParams(location.search);
  
  // Fetch filter options when component mounts
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await fetchFilterOptions();
        if (options) {
          setFilterOptions({
            categories: options.categories || [],
            genders: options.genders || [],
            models: options.models || [],
            activityTypes: options.activityTypes || [],
            sportTypes: options.sportTypes || [],
            colors: options.colors || [],
            sizes: options.sizes || [],
            sizesByCategory: options.sizesByCategory || {}
          });
        }
      } catch (error) {
        console.error("Failed to load filter options:", error);
        toast.error("Failed to load filter options");
      }
    };
    
    loadFilterOptions();
  }, []);

  // Initialize filters from URL
  useEffect(() => {
    const newFilters = {
      sortBy: queryParams.get("sortBy") || "",
      gender: queryParams.get("gender") || "",
      color: queryParams.get("color") || "",
      minRating: queryParams.get("minRating") || "",
      minDiscount: queryParams.get("minDiscount") || "",
      priceRange: [
        parseInt(queryParams.get("minPrice")) || 0,
        parseInt(queryParams.get("maxPrice")) || 1000,
      ],
      category: queryParams.getAll("category") || [],
      model: queryParams.getAll("model") || [],
      sportType: queryParams.getAll("sportType") || [],
      activityType: queryParams.getAll("activityType") || [],
      size: queryParams.getAll("size") || [],
    };
    
    setFilters(newFilters);
    setMobileFilters(newFilters);
    
    // Set selected category if filtering by category
    if (newFilters.category.length > 0) {
      setSelectedCategory(newFilters.category[0]);
    }
  }, [location.search]);

  // Format image URL
  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        // 1. Parse the raw query string
        const searchParams = new URLSearchParams(location.search);
        console.log("Fetching with:", searchParams.toString());
        
        // 2. Convert to a plain object: { key: value, ... }
        const filters = Object.fromEntries(searchParams.entries());
        
        // 3. Pass the object into your service
        const { products } = await fetchProducts(filters);
        
        setProducts(products);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [location.search]);
  // Update URL when filters change
const updateURL = (newFilters) => {
  const params = new URLSearchParams();
  
  // Add all filters to URL params
  if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);
  if (newFilters.gender) params.set("gender", newFilters.gender);
  if (newFilters.color) params.set("color", newFilters.color.toLowerCase()); // Ensure lowercase
  if (newFilters.minRating) params.set("minRating", newFilters.minRating);
  if (newFilters.minDiscount) params.set("minDiscount", newFilters.minDiscount);
  if (newFilters.priceRange[0] > 0) params.set("minPrice", newFilters.priceRange[0]);
  if (newFilters.priceRange[1] < 1000) params.set("maxPrice", newFilters.priceRange[1]);
  
  newFilters.category.forEach(c => params.append("category", c));
  newFilters.model.forEach(m => params.append("model", m));
  newFilters.sportType.forEach(s => params.append("sportType", s));
  newFilters.activityType.forEach(a => params.append("activityType", a));
  newFilters.size.forEach(s => params.append("size", s));
  
  console.log("Updating URL with params:", Object.fromEntries(params)); // Debug log
  
  navigate({ search: params.toString() }, { replace: true });
};

  // Handler functions for desktop filters
  const handleSortChange = (value) => {
    const newFilters = { ...filters, sortBy: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleGenderChange = (value) => {
    const newFilters = { ...filters, gender: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

// In your handleColorChange:
const handleColorChange = (value) => {
  const newFilters = { ...filters, color: value.toLowerCase() }; // Force lowercase
  setFilters(newFilters);
  updateURL(newFilters);
};

  const handleRatingChange = (value) => {
    const newFilters = { ...filters, minRating: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleDiscountChange = (value) => {
    const newFilters = { ...filters, minDiscount: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePriceChange = (min, max) => {
    const newFilters = { ...filters, priceRange: [min, max] };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleCategoryChange = (value, isChecked) => {
    const currentValues = [...filters.category];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    const newFilters = { ...filters, category: newValues };
    setFilters(newFilters);
    updateURL(newFilters);
    setSelectedCategory(isChecked ? value : null);
  };

  const handleModelChange = (value, isChecked) => {
    const currentValues = [...filters.model];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    const newFilters = { ...filters, model: newValues };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSportTypeChange = (value, isChecked) => {
    const currentValues = [...filters.sportType];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    const newFilters = { ...filters, sportType: newValues };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleActivityTypeChange = (value, isChecked) => {
    const currentValues = [...filters.activityType];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    const newFilters = { ...filters, activityType: newValues };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSizeChange = (value, isChecked) => {
    const currentValues = [...filters.size];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    const newFilters = { ...filters, size: newValues };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Handler functions for mobile filters
  const handleMobileSortChange = (value) => {
    setMobileFilters({ ...mobileFilters, sortBy: value });
  };

  const handleMobileGenderChange = (value) => {
    setMobileFilters({ ...mobileFilters, gender: value });
  };

  const handleMobileColorChange = (value) => {
    setMobileFilters({ ...mobileFilters, color: value });
  };

  const handleMobileRatingChange = (value) => {
    setMobileFilters({ ...mobileFilters, minRating: value });
  };

  const handleMobileDiscountChange = (value) => {
    setMobileFilters({ ...mobileFilters, minDiscount: value });
  };

  const handleMobilePriceChange = (min, max) => {
    setMobileFilters({ ...mobileFilters, priceRange: [min, max] });
  };

  const handleMobileCategoryChange = (value, isChecked) => {
    const currentValues = [...mobileFilters.category];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setMobileFilters({ ...mobileFilters, category: newValues });
    setSelectedCategory(isChecked ? value : null);
  };

  const handleMobileModelChange = (value, isChecked) => {
    const currentValues = [...mobileFilters.model];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setMobileFilters({ ...mobileFilters, model: newValues });
  };

  const handleMobileSportTypeChange = (value, isChecked) => {
    const currentValues = [...mobileFilters.sportType];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setMobileFilters({ ...mobileFilters, sportType: newValues });
  };

  const handleMobileActivityTypeChange = (value, isChecked) => {
    const currentValues = [...mobileFilters.activityType];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setMobileFilters({ ...mobileFilters, activityType: newValues });
  };

  const handleMobileSizeChange = (value, isChecked) => {
    const currentValues = [...mobileFilters.size];
    const newValues = isChecked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    setMobileFilters({ ...mobileFilters, size: newValues });
  };

  // Apply mobile filters
  const applyMobileFilters = () => {
    setFilters(mobileFilters);
    updateURL(mobileFilters);
    setShowFilters(false);
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = {
      sortBy: "",
      gender: "",
      color: "",
      minRating: "",
      minDiscount: "",
      priceRange: [0, 1000],
      category: [],
      model: [],
      sportType: [],
      activityType: [],
      size: [],
    };
    
    setFilters(clearedFilters);
    setMobileFilters(clearedFilters);
    updateURL(clearedFilters);
    setSelectedCategory(null);
    
    if (isMobile) {
      setShowFilters(false);
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

  // Get available sizes based on selected category
  const getAvailableSizes = () => {
    if (selectedCategory && filterOptions.sizesByCategory[selectedCategory]) {
      return filterOptions.sizesByCategory[selectedCategory];
    }
    return filterOptions.sizes;
  };

  // Filter component
  const FilterSection = ({ isMobile = false }) => {
    const currentFilters = isMobile ? mobileFilters : filters;
    const setCurrentFilters = isMobile ? setMobileFilters : setFilters;

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
                checked={currentFilters.sortBy === option.value}
                onChange={() => 
                  isMobile 
                    ? handleMobileSortChange(option.value)
                    : handleSortChange(option.value)
                }
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
            ...filterOptions.genders.map(gender => ({
              value: gender.toLowerCase(),
              label: gender.charAt(0).toUpperCase() + gender.slice(1)
            }))
          ].map((option) => (
            <label key={option.value} className="flex items-center space-x-3">
              <input
                type="radio"
                name="gender"
                checked={currentFilters.gender === option.value}
                onChange={() => 
                  isMobile 
                    ? handleMobileGenderChange(option.value)
                    : handleGenderChange(option.value)
                }
                className="h-4 w-4 text-black border-gray-300 focus:ring-black"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Category</h3>
          {filterOptions.categories.map((category) => {
            const isChecked = currentFilters.category.includes(category);
            return (
              <label key={category} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => 
                    isMobile 
                      ? handleMobileCategoryChange(category, e.target.checked)
                      : handleCategoryChange(category, e.target.checked)
                  }
                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span>{category}</span>
              </label>
            );
          })}
        </div>

        {/* Model/Brand Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Brand</h3>
          {filterOptions.models.map((model) => {
            const isChecked = currentFilters.model.includes(model);
            return (
              <label key={model} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => 
                    isMobile 
                      ? handleMobileModelChange(model, e.target.checked)
                      : handleModelChange(model, e.target.checked)
                  }
                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span>{model}</span>
              </label>
            );
          })}
        </div>

        {/* Sport Type Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Sport Type</h3>
          {filterOptions.sportTypes.map((sport) => {
            const isChecked = currentFilters.sportType.includes(sport);
            return (
              <label key={sport} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => 
                    isMobile 
                      ? handleMobileSportTypeChange(sport, e.target.checked)
                      : handleSportTypeChange(sport, e.target.checked)
                  }
                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span>{sport}</span>
              </label>
            );
          })}
        </div>

        {/* Activity Type Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Activity Type</h3>
          {filterOptions.activityTypes.map((activity) => {
            const isChecked = currentFilters.activityType.includes(activity);
            return (
              <label key={activity} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => 
                    isMobile 
                      ? handleMobileActivityTypeChange(activity, e.target.checked)
                      : handleActivityTypeChange(activity, e.target.checked)
                  }
                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span>{activity}</span>
              </label>
            );
          })}
        </div>

        {/* Size Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Size</h3>
          {getAvailableSizes().map((size) => {
            const isChecked = currentFilters.size.includes(size);
            return (
              <label key={size} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => 
                    isMobile 
                      ? handleMobileSizeChange(size, e.target.checked)
                      : handleSizeChange(size, e.target.checked)
                  }
                  className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <span>{size}</span>
              </label>
            );
          })}
        </div>

        {/* Color Filter */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium mb-2">Color</h3>
          {filterOptions.colors.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  checked={currentFilters.color === ""}
                  onChange={() => 
                    isMobile 
                      ? handleMobileColorChange("")
                      : handleColorChange("")
                  }
                  className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                />
                <span className="text-sm">All</span>
              </label>

              {filterOptions.colors.map((color) => (
                <label
                  key={color}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="color"
                    checked={currentFilters.color === color}
                    onChange={() => 
                      isMobile 
                        ? handleMobileColorChange(color)
                        : handleColorChange(color)
                    }
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
                checked={currentFilters.minRating === option.value}
                onChange={() => 
                  isMobile 
                    ? handleMobileRatingChange(option.value)
                    : handleRatingChange(option.value)
                }
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
                checked={currentFilters.minDiscount === option.value}
                onChange={() => 
                  isMobile 
                    ? handleMobileDiscountChange(option.value)
                    : handleDiscountChange(option.value)
                }
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
              <span>₹{currentFilters.priceRange[0]}</span>
              <span>₹{currentFilters.priceRange[1]}</span>
            </div>
            <div className="flex space-x-4">
              <input
                type="range"
                min="0"
                max="1000"
                value={currentFilters.priceRange[0]}
                onChange={(e) => {
                  const min = Number(e.target.value);
                  const max = currentFilters.priceRange[1];
                  isMobile 
                    ? handleMobilePriceChange(min, max)
                    : handlePriceChange(min, max);
                }}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="1000"
                value={currentFilters.priceRange[1]}
                onChange={(e) => {
                  const min = currentFilters.priceRange[0];
                  const max = Number(e.target.value);
                  isMobile 
                    ? handleMobilePriceChange(min, max)
                    : handlePriceChange(min, max);
                }}
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
          {title} ({products.length})
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

        <FilterSection isMobile />

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
            ${showFilters ? 'translate-x-0' : '-translate-x-full'}
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
                      <p className="text-gray-500 text-sm">{product.gender}</p>

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
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500 mb-4">
                      No products found matching your filters.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
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

export default ProductListPage;