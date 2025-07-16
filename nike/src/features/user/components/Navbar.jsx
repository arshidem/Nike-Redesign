import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  BagIcon,
  ArrowIcon,
  XIcon,
} from "../../../shared/ui/Icons";
import "../../../css/navbar.css";
import toast from "react-hot-toast";

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
  const { user, authReady, setUser, backendUrl, setToken } = useAppContext();
  const menuRef = useRef(null); // Step 1: ref for mobile menu
  // Step 2: Add click-outside listener
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
  e.preventDefault();       // optional, good for safety
  e.stopPropagation();      // prevent it from reaching document listener
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

  const menus = {
  "New & Featured": [
    { label: "New Arrivals", link: "/new/arrivals?newArrival=true" },
    { label: "Best Sellers", link: "/new/best-sellers?bestSellers=true" },
    { label: "Trending", link: "/new/trending?isTrending=true" },
  ],
  Men: [
    { label: "New Arrivals", link: "/men/arrivals?gender=men&newArrival=true" },
    { label: "Best Sellers", link: "/men/best-sellers?gender=men&bestSellers=true" },
    { label: "Shoes", link: "/men/shoes?gender=men&category=shoes" },
    { label: "Clothing", link: "/men/clothing?gender=men&category=clothing" },
  ],
  Women: [
    { label: "New Arrivals", link: "/women/arrivals?gender=women&newArrival=true" },
    { label: "Best Sellers", link: "/women/best-sellers?gender=women&bestSellers=true" },
    { label: "Shoes", link: "/women/shoes?gender=women&category=shoes" },
    { label: "Clothing", link: "/women/clothing?gender=women&category=clothing" },
  ],
  Kids: [
    { label: "New Arrivals", link: "/kids/arrivals?gender=kids&newArrival=true" },
    { label: "Best Sellers", link: "/kids/best-sellers?gender=kids&bestSellers=true" },
    { label: "Shoes", link: "/kids/shoes?gender=kids&category=shoes" },
    { label: "Clothing", link: "/kids/clothing?gender=kids&category=clothing" },
    { label: "Kids By Age", link: "/kids/age" }, // for future use
  ],


    Sale: [
      { label: "Shop All Sale", link: "/sale/shopAllSale" },
      { label: "Best Sellers", link: "/sale/best-sellers" },
      { label: "Last Chance", link: "/sale/lastChance" },
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
            <Link to="/favourite" className="icon-btn">
              <HeartIcon />
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

            <Link to="/user" className="icon-btn">
              <UserIcon />
            </Link>
            <Link to="/favourite" className="icon-btn">
              <HeartIcon />
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
            <div className="search-overlay-content">
              <div>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg"
                  alt="Nike Logo"
                  className="nike-logo"
                />
              </div>
              <div className="input-div">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="input-search-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197M15.803 15.803A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="search-input"
                />
              </div>
              <div>
                <button className="cancel-btn" onClick={closeSearch}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// SVG Icons
