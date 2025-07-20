import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  SearchIcon,
  UserIcon,
  HeartIcon,
  BagIcon,
  ArrowIcon,
  XIcon,
} from "../../../shared/ui/Icons";
import "../../../css/navbar.css";
import { useAppContext } from "../../../context/AppContext";
import Search from "./Search";
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagItemCount, setBagItemCount] = useState(0);
  const { user, authReady, backendUrl, setUser, setToken } = useAppContext();
  const menuRef = useRef(null);

  // Update bag count from localStorage
  useEffect(() => {
    const updateBagCount = () => {
      const stored = localStorage.getItem("bagItems");
      setBagItemCount(stored ? JSON.parse(stored).length : 0);
    };
    updateBagCount();
    window.addEventListener("storage", updateBagCount);
    return () => window.removeEventListener("storage", updateBagCount);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setSubmenuOpen(null);
        setIsAnimating(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!authReady) return null;

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => {
      if (open) {
        setSubmenuOpen(null);
        setIsAnimating(false);
      }
      return !open;
    });
  };
  console.log("searchOpen state is now:", searchOpen);

  const openSubmenu = (name) => {
    setSubmenuOpen(name);
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 0);
  };

  const closeSubmenu = () => {
    setIsAnimating(false);
    setTimeout(() => setSubmenuOpen(null), 300);
  };

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

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
      {
        label: "Clothing",
        link: "/men/clothing?gender=men&category=clothing",
      },
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
      { label: "Kids By Age", link: "/kids/age" },
    ],
    Sale: [
      { label: "Shop All Sale", link: "/sale/shopAllSale?minDiscount=1" },
      {
        label: "Best Sellers",
        link: "/sale/best-sellers?bestSellers=true&minDiscount=1",
      },
      {
        label: "Last Chance",
        link: "/sale/last-chance?minDiscount=40&lastChance=true",
      },
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
      {/* Top bar (desktop only) */}
      <div className="fixed top-0 hidden md:flex justify-end items-center px-6 py-2 bg-gray-50 text-sm gap-4 border-b w-full z-50">
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
            <button
              onClick={() => openSubmenu("user")}
              className="flex items-center gap-1 font-medium"
            >
              Hi, {user.name.split(" ")[0]} <UserIcon className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-5 w-48 bg-white border shadow-lg rounded-md opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-50">
              {menus.user.map((item) =>
                item.type === "logout" ? (
                  <button
                    key={item.label}
                    onClick={async () => {
                      await fetch(`${backendUrl}/api/auth/logout`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      });
                      localStorage.removeItem("token");
                      setUser(null);
                      setToken(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.link}
                    to={item.link}
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
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
              .filter((k) => k !== "user")
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
            <div className="navbar-link-without-dropdown flex gap-5">
              <Link to="/snkrs" className="main-link">
                SNKRS
              </Link>
              {user?.role === "admin" && (
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
            <Link to="/wishlist" className="icon-btn">
              <HeartIcon className="fill-white stroke-black" />
            </Link>
            <Link to="/bag" className="icon-btn relative">
              <BagIcon />
              {bagItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] rounded-full px-1.5">
                  {bagItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Icons & Hamburger */}
          <div className="navbar-mobile-icons">
            <button onClick={openSearch} className="icon-btn">
              <SearchIcon />
            </button>
            <Link to="/wishlist" className="icon-btn">
              <HeartIcon className="fill-white stroke-black" />
            </Link>
            <Link to="/bag" className="icon-btn relative">
              <BagIcon />
              {bagItemCount > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] rounded-full px-1.5">
                  {bagItemCount}
                </span>
              )}
            </Link>
            <div className="navbar-toggle" onClick={toggleMenu}>
              <div className={`menu-btn ${menuOpen ? "open" : ""}`}>
                <span className="line line1" />
                <span className="line line2" />
                <span className="line line3" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          ref={menuRef}
          className={`navbar-mobile-menu ${menuOpen ? "open" : ""}`}
        >
          <div className="main-menu">
            {user && (
              <button
                onClick={() => openSubmenu("user")}
                className="flex justify-between w-full py-2 font-semibold"
              >
                Hi, {user.name.split(" ")[0]} <ArrowIcon />
              </button>
            )}
            {Object.keys(menus)
              .filter((k) => k !== "user")
              .map((menuName) => (
                <button
                  key={menuName}
                  onClick={() => openSubmenu(menuName)}
                  className="flex justify-between w-full py-2"
                >
                  {menuName} <ArrowIcon />
                </button>
              ))}
            <Link to="/snkrs" className="py-2 block">
              SNKRS
            </Link>
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
            {user?.role === "admin" && (
              <Link to="/admin" className="py-2 block">
                Admin Dashboard
              </Link>
            )}
          </div>

          {submenuOpen && (
            <div className="navbar-submenu-wrapper absolute top-0 ">
              <div
                className={`navbar-submenu ${isAnimating ? "open" : "closing"}`}
              >
                <button onClick={closeSubmenu} className="back-btn">
                  <XIcon />
                </button>
                {menus[submenuOpen].map((item) =>
                  item.type === "logout" ? (
                    <button
                      key={item.label}
                      onClick={async () => {
                        await fetch(`${backendUrl}/api/auth/logout`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                        });
                        localStorage.removeItem("token");
                        setUser(null);
                        setToken(null);
                      }}
                      className="block w-full text-left px-8 py-2"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.link}
                      to={item.link}
                      onClick={closeSubmenu}
                      className="block py-2 pl-4"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      {searchOpen && (
  <div className="search-wrapper">
  <Search

isOpen={searchOpen}
onClose={closeSearch}
/>

  </div>
)}

    </>
  );
}
