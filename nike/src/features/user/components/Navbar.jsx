import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  HeartIcon,
  ShoppingBagIcon,
  Bars2Icon,
  XMarkIcon,
  ArrowUpRightIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAppContext } from "../../../context/AppContext";
import Search from "./Search";
import "../../../css/navbar.css";

const menus = [
  {
    label: "New & Featured",
    to: "/new/arrivals?newArrival=true",
    items: [
      ["New arrivals", "/new/arrivals?newArrival=true"],
      ["Best sellers", "/new/best-sellers?bestSellers=true"],
      ["Trending now", "/new/trending?isTrending=true"],
    ],
  },
  ...["Men", "Women", "Kids"].map((label) => ({
    label,
    to: `/${label.toLowerCase()}/shoes?gender=${label.toLowerCase()}&category=shoes`,
    items: [
      [
        "Shoes",
        `/${label.toLowerCase()}/shoes?gender=${label.toLowerCase()}&category=shoes`,
      ],
      [
        "Clothing",
        `/${label.toLowerCase()}/clothing?gender=${label.toLowerCase()}&category=clothing`,
      ],
      [
        "New arrivals",
        `/${label.toLowerCase()}/arrivals?gender=${label.toLowerCase()}&newArrival=true`,
      ],
    ],
  })),
  {
    label: "Sale",
    to: "/sale/shopAllSale?minDiscount=1",
    items: [
      ["Shop all sale", "/sale/shopAllSale?minDiscount=1"],
      ["Last chance", "/sale/last-chance?minDiscount=40&lastChance=true"],
    ],
  },
];

export function Navbar() {
  const { user, logout, backendUrl } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagItemCount, setBagItemCount] = useState(0);
  const location = useLocation();
  const menuButton = useRef(null);
  const header = useRef(null);
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    header.current?.querySelectorAll("details[open]").forEach((item) => {
      item.open = false;
    });
  }, [location.pathname, location.search]);
  useEffect(() => {
    const update = () => {
      try {
        const items = JSON.parse(localStorage.getItem("bagItems") || "[]");
        setBagItemCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setBagItemCount(0);
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("cartUpdated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        header.current?.querySelectorAll("details[open]").forEach((item) => {
          item.open = false;
        });
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  const signOut = async () => {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch {
      /* Always clear the local session even when the API is unavailable. */
    } finally {
      logout();
    }
  };
  return (
    <header className="store-header" ref={header}>
      <a className="store-skip" href="#main-content">
        Skip to content
      </a>
      <div className="store-utility">
        <span>MADE TO MOVE. MADE FOR YOU.</span>
        <div>
          {user ? (
            <>
              <Link to="/account">
                Hi, {user.name?.split(" ")[0] || "there"}
              </Link>
              {user.role === "admin" && <Link to="/admin">Dashboard</Link>}<button onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/signin">
              Join us / Sign in <ArrowUpRightIcon />
            </Link>
          )}
        </div>
      </div>
      <nav className="store-nav" aria-label="Main navigation">
        <Link to="/home" className="store-wordmark" aria-label="Nike home">
          <img src="/assets/logo/nikeLogo.png" alt="Nike" />
          <span>
            NIKE<span className="wordmark-star">®</span>
          </span>
        </Link>
        <div className="store-nav-links">
          {menus.map((menu) => (
            <details className="store-dropdown" key={menu.label}>
              <summary>{menu.label}</summary>
              <div className="store-dropdown-panel">
                {menu.items.map(([label, to]) => (
                  <Link key={to} to={to}>
                    {label}
                    <ArrowUpRightIcon />
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
        <div className="store-nav-actions">
          <button
            className="store-icon-button store-search-button"
            aria-label="Search products"
            onClick={() => setSearchOpen(true)}
          >
            <MagnifyingGlassIcon />
            <span>Search</span>
          </button>
          <Link
            className="store-icon-button store-wishlist-link"
            to="/wishlist"
            aria-label="Wishlist"
          >
            <HeartIcon />
          </Link>
          <Link
            className="store-icon-button"
            to="/bag"
            aria-label={`Shopping bag${bagItemCount ? `, ${bagItemCount} items` : ""}`}
          >
            <ShoppingBagIcon />
            {bagItemCount > 0 && (
              <span className="store-bag-count">{bagItemCount}</span>
            )}
          </Link>
          <button
            ref={menuButton}
            className="store-icon-button store-menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="store-mobile-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <XMarkIcon /> : <Bars2Icon />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <nav
          className="store-mobile-nav"
          id="store-mobile-nav"
          aria-label="Mobile navigation"
        >
          {menus.map((menu) => (
            <details key={menu.label}>
              <summary>{menu.label}</summary>
              {menu.items.map(([label, to]) => (
                <Link key={to} to={to}>
                  {label}
                  <ArrowUpRightIcon />
                </Link>
              ))}
            </details>
          ))}
          <Link to="/wishlist">
            <HeartIcon /> Your favourites
          </Link>
          <Link to={user ? "/account" : "/signin"}>
            <UserIcon />
            {user ? "Your account" : "Join us / Sign in"}
          </Link>
          <Link to="/orders">
            Your orders <ArrowUpRightIcon />
          </Link>
          {user?.role === "admin" && <Link to="/admin">Admin dashboard</Link>}
        </nav>
      )}
      {searchOpen && <Search isOpen onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
