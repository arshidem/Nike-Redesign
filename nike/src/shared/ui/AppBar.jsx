import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import "./app-bar.css";

export function AppBarBrand() {
  return (
    <Link to="/home" className="customer-appbar-brand" aria-label="Nike home">
      <img src="/assets/logo/nikeLogo.png" alt="" />
      <span>NIKE</span>
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
}) {
  const navigate = useNavigate();
  const Tag = home ? "nav" : "header";
  return (
    <Tag
      className={`customer-appbar ${home ? "customer-appbar-home" : ""} ${className}`}
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
          <AppBarBrand />
          <div className="customer-appbar-actions">
            {!hideSearch && (
              <button
                type="button"
                aria-label="Search products"
                onClick={onSearch || (() => navigate("/search"))}
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
  );
}
