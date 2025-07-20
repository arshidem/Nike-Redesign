import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { SearchIcon, XIcon, NikeSwoosh } from "../../../shared/ui/Icons";
import { useAppContext } from "../../../context/AppContext";
import { toast } from "react-hot-toast";
import { debounce } from "lodash";
import "../../../css/navbar.css";

export default function Search({ isOpen, onClose }) {
  const { backendUrl } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const searchInputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = debounce(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const response = await axios.get(`${backendUrl}/api/products/search`, {
        params: { q: query },
      });
      setSearchResults(response.data.results || []);
      setRecentSearches((prev) => [query, ...prev.filter((item) => item !== query)].slice(0, 5));
    } catch (err) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, 300);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    debouncedSearch.cancel();
    await debouncedSearch(searchQuery);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
      setSearchQuery("");
      setSearchResults([]);
    }, 300);
  };

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  if (!isOpen && !isExiting) return null;

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

return (
 <div
  className={`fixed inset-0 bg-black bg-opacity-50 h-[150%] flex items-start justify-center z-50 p-4 
    transition-opacity duration-300 
    ${isExiting ? "search-slide-out" : "search-slide-in"}`}
>


      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <NikeSwoosh className="h-6 w-6 text-black" />
          <form onSubmit={handleSearchSubmit} className="relative flex-1 mx-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search for products, colors, etc."
              className="w-full border-b border-gray-300 pl-10 pb-1 focus:outline-none"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 h-5 w-5"
              >
                <XIcon className="h-full w-full" />
              </button>
            )}
          </form>
          <button onClick={handleClose} className="ml-4 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {searchQuery ? (
            isSearching ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 border-t-2 border-b-2 border-black rounded-full animate-spin"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}`}
                    onClick={handleClose}
                    className="flex gap-4 p-3 border rounded hover:shadow transition"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={formatImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                      <div className="text-sm text-gray-700 mt-1">₹{product.finalPrice?.toLocaleString()}</div>
                      {product.discountPercentage > 0 && (
                        <div className="text-xs text-red-500">
                          {product.discountPercentage}% OFF
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No results found for “{searchQuery}”
              </div>
            )
          ) : recentSearches.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">Recent Searches</h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => debouncedSearch(search)}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
