import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  BagIcon,
  ArrowIcon,
  XIcon,
  NikeSwoosh,
} from "../../../shared/ui/Icons";
import "../../../css/navbar.css";
import toast from "react-hot-toast";
import { debounce } from "lodash";

import { useAppContext } from "../../../context/AppContext";
const getFromLocalStorageWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiresAt) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [bagItemCount, setBagItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchInputRef = useRef(null);
  const { user, authReady, setUser, backendUrl, setToken } = useAppContext();
  const menuRef = useRef(null); // Step 1: ref for mobile menu
  // Step 2: Add click-outside listener

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setSubmenuOpen(null);
        setIsAnimating(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);
  useEffect(() => {
    const updateBagCount = () => {
      const items = getFromLocalStorageWithExpiry("bagItems");
      setBagItemCount(items ? items.length : 0);
    };

    updateBagCount(); // Run on mount
    window.addEventListener("storage", updateBagCount);
    return () => window.removeEventListener("storage", updateBagCount);
  }, []);

  if (!authReady) {
    // Show spinner or nothing until auth is ready
    return null;
  }

  console.log(user);

  // Render your JSX here

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      setSearchOpen(false);
    }, 300); // match the duration in CSS
  };
  const toggleMenu = (e) => {
    e.preventDefault(); // optional, good for safety
    e.stopPropagation(); // prevent it from reaching document listener
    setMenuOpen((prev) => {
      if (prev) {
        setSubmenuOpen(null);
        setIsAnimating(false);
      }
      return !prev;
    });
  };

  const handleSubmenu = (menuName) => {
    setSubmenuOpen(menuName); // Step 1: mount submenu off-screen
    setIsAnimating(false); // Start closed

    // Step 2: trigger slide-in on next tick
    setTimeout(() => {
      setIsAnimating(true);
    }, 0);
  };

  const handleCloseSubmenu = () => {
    setIsAnimating(false); // trigger slide-out
    setTimeout(() => {
      setSubmenuOpen(null); // unmount submenu after animation
    }, 300);
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query || query.length < 2) {
      toast("Please enter at least 2 characters");
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${backendUrl}/api/products/search`, {
        params: { q: query },
      });
      setSearchResults(response.data.results);

      // Add to recent searches
      setRecentSearches((prev) =>
        [query, ...prev.filter((item) => item !== query)].slice(0, 5)
      );
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  // Add this at the top of your component

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        if (query.length < 2) {
          setSearchResults([]);
          return;
        }
        try {
          setIsSearching(true);
          const response = await axios.get(
            `${backendUrl}/api/products/search`,
            {
              params: { q: query },
            }
          );
          setSearchResults(response.data.results || []);
        } catch (err) {
          console.error("Search failed:", err);
          toast.error("Search failed. Please try again.");
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [backendUrl]
  );

  // 2️⃣ Cleanup on unmount:
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 3️⃣ Handle input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // 4️⃣ Fallback “Enter”-key search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    debouncedSearch.cancel(); // cancel pending
    await debouncedSearch(searchQuery);
  };

  const menus = {
    "New & Featured": [
      { label: "New Arrivals", link: "/new/arrivals?newArrival=true" },
      { label: "Best Sellers", link: "/new/best-sellers?bestSellers=true" },
      { label: "Trending", link: "/new/trending?isTrending=true" },
    ],
    Men: [
      {
        label: "New Arrivals",
        link: "/men/arrivals?gender=men&newArrival=true",
      },
      {
        label: "Best Sellers",
        link: "/men/best-sellers?gender=men&bestSellers=true",
      },
      { label: "Shoes", link: "/men/shoes?gender=men&category=shoes" },
      { label: "Clothing", link: "/men/clothing?gender=men&category=clothing" },
    ],
    Women: [
      {
        label: "New Arrivals",
        link: "/women/arrivals?gender=women&newArrival=true",
      },
      {
        label: "Best Sellers",
        link: "/women/best-sellers?gender=women&bestSellers=true",
      },
      { label: "Shoes", link: "/women/shoes?gender=women&category=shoes" },
      {
        label: "Clothing",
        link: "/women/clothing?gender=women&category=clothing",
      },
    ],
    Kids: [
      {
        label: "New Arrivals",
        link: "/kids/arrivals?gender=kids&newArrival=true",
      },
      {
        label: "Best Sellers",
        link: "/kids/best-sellers?gender=kids&bestSellers=true",
      },
      { label: "Shoes", link: "/kids/shoes?gender=kids&category=shoes" },
      {
        label: "Clothing",
        link: "/kids/clothing?gender=kids&category=clothing",
      },
      { label: "Kids By Age", link: "/kids/age" }, // for future use
    ],

Sale: [
  { label: "Shop All Sale", link: "/sale/shopAllSale?minDiscount=1" },
  { label: "Best Sellers", link: "/sale/best-sellers?bestSellers=true&minDiscount=1" },
  { label: "Last Chance", link: "/sale/last-chance?minDiscount=40&lastChance=true" },
],


    user: [
      { label: "Profile", link: "/profile" },
      { label: "Orders", link: "/orders" },
      { label: "Account Settings", link: "/account" },
      { label: "Log Out", type: "logout" },
    ],
  };

  return (
    <>
      {authReady && (
        <div className="fixed top-0 hidden md:flex justify-end items-center px-6 py-2 bg-gray-50 text-sm gap-4 border-b w-full topBar z-50">
          <a href="#" className="hover:underline">
            Find a Store
          </a>
          <span>|</span>
          <a href="#" className="hover:underline">
            Help
          </a>
          <span>|</span>

          {user ? (
            <div className="relative group">
              <div className="flex items-center gap-1 text-black font-medium cursor-pointer">
                Hi, {user.name?.split(" ")[0]}
                <UserIcon className="w-4 h-4" />
              </div>

              {/* Dropdown on hover */}
              <div className="absolute right-0 top-5 w-48 bg-white border shadow-lg rounded-md opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50">
                {menus.user.map((item) =>
                  item.type === "logout" ? (
                    <button
                      key={item.label}
                      onClick={async () => {
                        try {
                          await axios.post(
                            `${backendUrl}/api/auth/logout`,
                            null,
                            {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );

                          localStorage.removeItem("token");
                          setUser(null);
                          setToken(null);
                        } catch (err) {
                          console.error("Logout failed:", err);
                          alert("Logout failed. Please try again.");
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.link}
                      to={item.link}
                      className="block px-4 py-2 text-sm text-black hover:bg-gray-100"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ) : (
            <Link to="/signin" className="hover:underline">
              Sign In
            </Link>
          )}
        </div>
      )}

      <nav className="navbar md:top-8 z-50">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg"
                alt="Nike Logo"
              />
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="navbar-links">
            {Object.keys(menus)
              .filter((key) => key !== "user")
              .map((menuName) => (
                <div key={menuName} className="navbar-link-with-dropdown">
                  <Link to="#" className="main-link">
                    {menuName}
                  </Link>

                  <div className="dropdown-menu">
                    {menus[menuName].map((item) => (
                      <Link
                        key={item.link}
                        to={item.link}
                        className="dropdown-item"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            <div className="navbar-link-without-dropdown flex justify-between gap-5">
              <Link to="/snkrs" className="main-link">
                SNKRS
              </Link>
              {authReady && user?.role === "admin" && (
                <Link to="/admin" className="main-link">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="navbar-icons">
            <button onClick={openSearch} className="icon-btn">
              <SearchIcon />
            </button>

            <Link to="/user" className="icon-btn md:hidden">
              <UserIcon />
            </Link>
            <Link to="/wishlist" className="icon-btn">
              <HeartIcon className="fill-white stroke-black" />
            </Link>
            <Link to="/bag" className="icon-btn relative">
              <BagIcon />
              {bagItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-black text-[10px] rounded-full px-1.5">
                  {bagItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Icons + Hamburger */}
          <div className="navbar-mobile-icons">
            <button onClick={openSearch} className="icon-btn">
              <SearchIcon />
            </button>

            <Link to="/profile" className="icon-btn">
              <UserIcon />
            </Link>
            <Link to="/wishlist" className="icon-btn">
              <HeartIcon className="fill-white stroke-black" />
            </Link>
            <Link to="/bag" className="icon-btn relative">
              <BagIcon />
              {bagItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-black text-[10px] rounded-full px-1.5">
                  {bagItemCount}
                </span>
              )}
            </Link>

            <div className="navbar-toggle" onClick={(e) => toggleMenu(e)}>
              <div className={`menu-btn ${menuOpen ? "open" : ""}`}>
                <span className="line line1"></span>
                <span className="line line2"></span>
                <span className="line line3"></span>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={menuRef} // Step 3: attach the ref
          className={`navbar-mobile-menu ${menuOpen ? "open" : ""}`}
        >
          {/* Main Menu — always visible */}
          <div className="main-menu">
            {authReady && user && (
              <div className="border-b pb-2 mb-2">
                <button
                  onClick={() => handleSubmenu("user")}
                  className="flex justify-between w-full py-2 font-semibold text-black"
                >
                  Hi, {user.name.split(" ")[0] || "User"}
                  <ArrowIcon />
                </button>
              </div>
            )}

            {Object.keys(menus)
              .filter((key) => key !== "user") // skip the "user" menu here
              .map((menuName) => (
                <button
                  key={menuName}
                  onClick={() => handleSubmenu(menuName)}
                  className="flex justify-between w-full py-2"
                >
                  {menuName}
                  <ArrowIcon />
                </button>
              ))}

            <Link to="/snkrs" className="py-2 block">
              SNKRS
            </Link>

            {/* Show Sign In only if not logged in */}
            {authReady && !user && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Become a Nike Member for the best products, inspiration and
                  stories in sport.{" "}
                  <span className="underline font-medium cursor-pointer">
                    Learn more
                  </span>
                </p>

                <div className="flex gap-1">
                  {/* Sign In button only */}
                  <Link
                    to="/signin"
                    className="border border-black text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {authReady && user?.role === "admin" && (
              <Link to="/admin" className="py-2 block">
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Submenu — absolutely positioned overlay */}
          {submenuOpen && (
            <div className="navbar-submenu-wrapper">
              <div
                className={`navbar-submenu ${
                  isAnimating ? "open" : "closing"
                } ${user ? "top-[-400px]" : "top-[-434px]"}`}
              >
                <button onClick={handleCloseSubmenu} className="back-btn">
                  <XIcon />
                </button>
                {menus[submenuOpen].map((item) =>
                  item.type === "logout" ? (
                    <button
                      key={item.label}
                      onClick={async () => {
                        try {
                          await axios.post(
                            `${backendUrl}/api/auth/logout`,
                            null,
                            {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );
                          localStorage.removeItem("token");
                          setUser(null);
                          setToken(null);
                        } catch (err) {
                          console.error("Logout failed:", err);
                        }
                      }}
                      className="block w-full text-left px-8 py-2 text-black hover:bg-gray-100"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.link}
                      to={item.link}
                      className="block py-2 pl-4 text-black hover:bg-gray-100"
                      onClick={handleCloseSubmenu}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
        {searchOpen && (
          <div className={`search-overlay ${isExiting ? "slide-out" : ""}`}>
            <div className="search-overlay-content ">
              <div className="flex items-center justify-between ">
                <NikeSwoosh />

                <div className="input-div relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    ref={searchInputRef}
                    placeholder="Search for products, colors, etc."
                    className="search-input w-full pl-10 pr-4 py-3 border-b border-black focus:outline-none focus:border-black"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <button
                  className="cancel-btn text-black hover:text-gray-600 transition-colors"
                  onClick={closeSearch}
                >
                  Cancel
                </button>
              </div>

              <div className="relative mt-6">
                {/* Search results container */}
                {searchQuery && (
                  <div className="search-results-container mt-4 max-h-[60vh] overflow-y-auto px-4">
                    {isSearching ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-black rounded-full" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((product) => (
                          <Link
                            key={product._id}
                            to={`/product/${product.slug}`}
                            className="flex gap-4 p-3 bg-white rounded-lg hover:shadow-lg transition"
                            onClick={closeSearch}
                          >
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                              <img
                                src={formatImageUrl(product.image)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) =>
                                  (e.currentTarget.src = "/placeholder.jpg")
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                                {product.name}
                              </h4>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-sm font-semibold text-black">
                                  ₹{product.finalPrice?.toLocaleString()}
                                </span>
                                {product.discountPercentage > 0 && (
                                  <>
                                    <span className="text-xs line-through text-gray-400">
                                      ₹{product.price?.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-red-500">
                                      {product.discountPercentage}% OFF
                                    </span>
                                  </>
                                )}
                              </div>
                              {product.colors?.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">
                                    Colors:
                                  </span>
                                  <div className="flex items-center gap-1 mt-1">
                                    {product.colors
                                      .slice(0, 3)
                                      .map((color, i) => (
                                        <span
                                          key={i}
                                          className="w-3 h-3 rounded-full border"
                                          style={{
                                            backgroundColor:
                                              color.toLowerCase(),
                                          }}
                                          title={color}
                                        />
                                      ))}
                                    {product.colors.length > 3 && (
                                      <span className="text-xs text-gray-400">
                                        +{product.colors.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <p>No results found for “{searchQuery}”</p>
                        <p className="mt-1 text-sm">
                          Try different keywords or{" "}
                          <Link
                            to="/products"
                            className="underline text-black hover:text-gray-700"
                            onClick={closeSearch}
                          >
                            browse featured products
                          </Link>
                          .
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent searches (optional) */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Recent Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(search);
                            handleSearch({ preventDefault: () => {} });
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// SVG Icons
