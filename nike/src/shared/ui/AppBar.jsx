import { useScrollHeader } from "../../hooks/useScrollHeader";
import React, { useEffect, useState } from "react";
import Search from "../../features/user/components/Search";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import "./app-bar.css";

export function AppBarBrand({ showText = false }) {
  return (
    <Link to="/home" className="customer-appbar-brand" aria-label="Nike home">
      <img src="/assets/logo/nikeLogo.png" alt="Nike" />
      {showText && <span>NIKE</span>}
    </Link>
  );
}

/** Shared geometry; each page keeps only the actions relevant to its flow. */
export default function AppBar({
  className = "",
  fallback = "/home",
  onBack,
  onSearch,
  hideSearch = false,
  hideBag = false,
  bagCount = 0,
  home = false,
  children,
  center,
  scrollAware = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => setSearchOpen(false), [location.pathname, location.search]);
  const scroll = useScrollHeader({ enabled: scrollAware && !home });
  const Tag = home ? "nav" : "header";
  return (
    <>
      <Tag
        ref={scroll.ref}
        data-scroll-hidden={scrollAware && !home ? scroll.hidden : undefined}
        aria-hidden={scroll.hidden || undefined}
        inert={scroll.hidden || undefined}
        className={`customer-appbar ${scrollAware && !home ? "scroll-header scroll-header-sticky" : ""} ${home ? "customer-appbar-home" : ""} ${className}`}
        aria-label={home ? "Main navigation" : "Page navigation"}
      >
        {home ? (
          children
        ) : (
          <>
            <button
              type="button"
              className="customer-appbar-back"
              onClick={
                onBack ||
                (() =>
                  window.history.state?.idx > 0
                    ? navigate(-1)
                    : navigate(fallback))
              }
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
            {center ?? <AppBarBrand />}
            <div className="customer-appbar-actions">
              {!hideSearch && (
                <button
                  type="button"
                  aria-label="Search products"
                  onClick={onSearch || (() => setSearchOpen(true))}
                >
                  <MagnifyingGlassIcon />
                </button>
              )}
              {!hideBag && (
                <Link
                  to="/bag"
                  aria-label={
                    bagCount > 0
                      ? `Shopping bag, ${bagCount} items`
                      : "Shopping bag"
                  }
                >
                  <ShoppingBagIcon />
                  {bagCount > 0 && (
                    <span className="customer-appbar-count">{bagCount}</span>
                  )}
                </Link>
              )}
            </div>
          </>
        )}
      </Tag>
      {searchOpen && <Search isOpen onClose={() => setSearchOpen(false)} />}
    </>
  );
}
