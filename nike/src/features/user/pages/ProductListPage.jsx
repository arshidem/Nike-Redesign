import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  HeartIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import { useWishlist } from "../../../hooks/useWishlist";
import Search from "../components/Search";
import Footer from "../components/Footer";
import "../../../css/catalog.css";

const multiFilters = ["category", "model", "sportType", "activityType", "size"];
const collections = [
  ["newArrival", "New arrivals"],
  ["isTrending", "Trending"],
  ["bestSellers", "Best sellers"],
  ["lastChance", "Last chance"],
];
const sortOptions = [
  ["", "Featured"],
  ["newArrival", "Newest"],
  ["priceAsc", "Price: Low to high"],
  ["priceDesc", "Price: High to low"],
  ["sold", "Best selling"],
];
const label = (value) =>
  value.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());

function catalogHeading(params) {
  if (params.get("newArrival") === "true")
    return [
      "New",
      "Arrivals",
      "Fresh drops. Iconic styles. Your next move starts here.",
    ];
  if (params.get("isTrending") === "true")
    return [
      "Trending",
      "Now",
      "The styles making moves. Find your next everyday icon.",
    ];
  if (params.get("bestSellers") === "true")
    return [
      "Best",
      "Sellers",
      "The favourites you keep coming back to. For good reason.",
    ];
  if (params.get("lastChance") === "true" || params.has("minDiscount"))
    return [
      "The",
      "Sale",
      "More of what moves you. A little less on the price tag.",
    ];
  const gender = params.get("gender");
  const categories = params.getAll("category");
  if (gender)
    return [
      label(gender),
      categories.length === 1 ? label(categories[0]) : "Collection",
      "Find your fit. Make every day your own.",
    ];
  if (categories.length === 1)
    return [
      "Explore",
      label(categories[0]),
      "From the first layer to the finishing touch. Make it yours.",
    ];
  if (params.has("search"))
    return [
      "Your",
      "Results",
      `Find your next favourite for “${params.get("search")}”.`,
    ];
  return [
    "All",
    "Products",
    "Shoes, apparel and everyday essentials. Find what moves you.",
  ];
}

function FilterFields({ params, onChange, options }) {
  const toggle = (key, value, checked) => {
    const next = new URLSearchParams(params);
    const values = next.getAll(key).filter((item) => item !== value);
    next.delete(key);
    [...values, ...(checked ? [value] : [])].forEach((item) =>
      next.append(key, item),
    );
    onChange(next);
  };
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "") next.delete(key);
    else next.set(key, value);
    onChange(next);
  };
  const groups = [
    ["category", "Category", options.categories],
    ["model", "Model", options.models],
    ["sportType", "Sport", options.sportTypes],
    ["activityType", "Activity", options.activityTypes],
  ];
  const selectedCategories = params.getAll("category");
  const sizes =
    selectedCategories.length === 1
      ? options.sizesByCategory?.[selectedCategories[0]] || options.sizes
      : options.sizes;
  return (
    <div className="catalog-filter-fields">
      <fieldset>
        <legend>Collections</legend>
        {collections.map(([key, text]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={params.get(key) === "true"}
              onChange={(e) => set(key, e.target.checked ? "true" : "")}
            />
            {text}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Gender</legend>
        {[
          ["", "All"],
          ["men", "Men"],
          ["women", "Women"],
          ["kids", "Kids"],
          ["unisex", "Unisex"],
        ].map(([value, text]) => (
          <label key={value}>
            <input
              type="radio"
              name="catalog-gender"
              checked={(params.get("gender") || "") === value}
              onChange={() => set("gender", value)}
            />
            {text}
          </label>
        ))}
      </fieldset>
      {groups.map(
        ([key, text, values]) =>
          values?.length > 0 && (
            <fieldset key={key}>
              <legend>{text}</legend>
              {values.map((value) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={params.getAll(key).includes(value)}
                    onChange={(e) => toggle(key, value, e.target.checked)}
                  />
                  {label(value)}
                </label>
              ))}
            </fieldset>
          ),
      )}
      {sizes?.length > 0 && (
        <fieldset>
          <legend>Size</legend>
          <div className="catalog-size-options">
            {sizes.map((size) => (
              <label key={size}>
                <input
                  type="checkbox"
                  checked={params.getAll("size").includes(String(size))}
                  onChange={(e) =>
                    toggle("size", String(size), e.target.checked)
                  }
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {options.colors?.length > 0 && (
        <fieldset>
          <legend>Color</legend>
          <select
            aria-label="Color"
            value={params.get("color") || ""}
            onChange={(e) => set("color", e.target.value)}
          >
            <option value="">All colors</option>
            {options.colors.map((color) => (
              <option key={color} value={color}>
                {label(color)}
              </option>
            ))}
          </select>
        </fieldset>
      )}
      <fieldset>
        <legend>Price (₹)</legend>
        <div className="catalog-price-inputs">
          <label>
            Minimum
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Any"
              value={params.get("minPrice") || ""}
              onChange={(e) => set("minPrice", e.target.value)}
            />
          </label>
          <label>
            Maximum
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Any"
              value={params.get("maxPrice") || ""}
              onChange={(e) => set("maxPrice", e.target.value)}
            />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Rating</legend>
        <select
          aria-label="Minimum rating"
          value={params.get("minRating") || ""}
          onChange={(e) => set("minRating", e.target.value)}
        >
          <option value="">All ratings</option>
          {[4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} stars &amp; up
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Discount</legend>
        <select
          aria-label="Minimum discount"
          value={params.get("minDiscount") || ""}
          onChange={(e) => set("minDiscount", e.target.value)}
        >
          <option value="">Any discount</option>
          {[10, 20, 30, 40, 50].map((value) => (
            <option key={value} value={value}>
              {value}% &amp; up
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );
}

export default function ProductListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, user } = useAppContext();
  const { fetchProducts, fetchFilterOptions } = useProductService();
  const { wishlistLoading, isInWishlist, handleWishlistToggle } =
    useWishlist(user);
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const [state, setState] = useState({
    products: [],
    total: 0,
    pages: 0,
    genderCounts: {},
    loading: true,
    error: false,
  });
  const [options, setOptions] = useState({
    categories: [],
    genders: [],
    models: [],
    sportTypes: [],
    activityTypes: [],
    colors: [],
    sizes: [],
    sizesByCategory: {},
  });
  const [optionsError, setOptionsError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState("grid");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(new URLSearchParams());
  const [draftError, setDraftError] = useState("");
  const filterButton = useRef(null);
  const drawer = useRef(null);
  const heading = catalogHeading(params);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const activeFilters = [...params.entries()].filter(
    ([key]) => !["page", "limit", "sortBy"].includes(key),
  );

  useEffect(() => {
    let active = true;
    fetchFilterOptions()
      .then((result) => {
        if (!active) return;
        setOptionsError(!Array.isArray(result?.categories));
        if (result) setOptions((previous) => ({ ...previous, ...result }));
      })
      .catch(() => {
        if (active) setOptionsError(true);
      });
    return () => {
      active = false;
    };
  }, [backendUrl, retry]); // Service functions are recreated by the existing hook.

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const request = Object.fromEntries(params);
    multiFilters.forEach((key) => {
      if (params.has(key)) request[key] = params.getAll(key);
    });
    setState((previous) => ({ ...previous, loading: true, error: false }));
    fetchProducts(
      { ...request, page, limit: 24 },
      { signal: controller.signal, throwOnError: true },
    )
      .then((result) => {
        if (!active) return;
        setState({
          products: result.products,
          total: result.pagination.totalItems ?? result.products.length,
          pages: result.pagination.totalPages ?? 1,
          genderCounts: result.genderCounts || {},
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (active)
          setState({
            products: [],
            total: 0,
            pages: 0,
            genderCounts: {},
            loading: false,
            error: true,
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [location.search, backendUrl, retry]);

  useEffect(() => {
    setFiltersOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const closeSearch = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", closeSearch);
    return () => document.removeEventListener("keydown", closeSearch);
  }, []);
  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const targets = [
        ...drawer.current.querySelectorAll(
          "button:not([disabled]), input, select, a[href]",
        ),
      ];
      const first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      filterButton.current?.focus();
    };
  }, [filtersOpen]);

  const update = (next, keepPage = false) => {
    if (!keepPage) next.delete("page");
    navigate({ pathname: "/products", search: next.toString() });
  };
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "") next.delete(key);
    else next.set(key, value);
    update(next);
  };
  const removeFilter = (key, value) => {
    const next = new URLSearchParams(params);
    const remaining = next.getAll(key).filter((item) => item !== value);
    next.delete(key);
    remaining.forEach((item) => next.append(key, item));
    update(next);
  };
  const clearAll = () => {
    setFiltersOpen(false);
    update(new URLSearchParams());
  };
  const applyFilters = () => {
    const min = Number(draft.get("minPrice") || 0);
    const max = draft.has("maxPrice")
      ? Number(draft.get("maxPrice"))
      : Infinity;
    if (min < 0 || max < min) {
      setDraftError("Maximum price must be at least the minimum price.");
      return;
    }
    setDraftError("");
    update(new URLSearchParams(draft));
    setFiltersOpen(false);
  };
  const imageUrl = (path) => {
    if (typeof path !== "string" || !path)
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    const relative = normalized.includes("uploads/")
      ? normalized.slice(normalized.indexOf("uploads/"))
      : normalized.replace(/^\/+/, "");
    return `${(backendUrl || "").replace(/\/$/, "")}/${relative}`;
  };
  const chipLabel = (key, value) =>
    collections.find(([name]) => name === key)?.[1] ||
    {
      minPrice: `From ₹${value}`,
      maxPrice: `Up to ₹${value}`,
      minRating: `${value}★ & up`,
      minDiscount: `${value}% off & up`,
      search: `Search: ${value}`,
    }[key] ||
    label(value);

  return (
    <div className="catalog-storefront">
      <header className="catalog-header">
        <button
          className="catalog-back"
          onClick={() =>
            window.history.state?.idx > 0 ? navigate(-1) : navigate("/home")
          }
        >
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <Link
          to="/home"
          className="store-wordmark catalog-brand"
          aria-label="Nike home"
        >
          <img src="/assets/logo/nikeLogo.png" alt="" />
          <span>NIKE</span>
        </Link>
        <div className="catalog-header-actions">
          <button
            aria-label="Search products"
            onClick={() => setSearchOpen(true)}
          >
            <MagnifyingGlassIcon />
          </button>
          <Link to="/bag" aria-label="Shopping bag">
            <ShoppingBagIcon />
          </Link>
        </div>
      </header>
      {searchOpen && <Search isOpen onClose={() => setSearchOpen(false)} />}
      <main id="main-content">
        <section className="catalog-hero" aria-labelledby="catalog-title">
          <div className="catalog-hero-copy">
            <p className="store-eyebrow">FIND YOUR NEXT / NIKE</p>
            <h1 id="catalog-title">
              <span>{heading[0]}</span>
              <span>
                {heading[1]}{" "}
                <em aria-label={`${state.total} products`}>
                  ({state.loading || state.error ? "…" : state.total})
                </em>
              </span>
            </h1>
            <p>{heading[2]}</p>
          </div>
          <span className="catalog-hero-outline" aria-hidden="true">
            NIKE
          </span>
          <div className="catalog-hero-orbit" aria-hidden="true" />
          <img
            src="/assets/editorial/dunk.png"
            alt=""
            className="catalog-hero-shoe"
            width="1000"
            height="500"
            fetchPriority="high"
          />
        </section>
        <div className="catalog-content">
          <div className="catalog-toolbar">
            <button
              className="catalog-control"
              ref={filterButton}
              onClick={() => {
                setDraft(new URLSearchParams(params));
                setDraftError("");
                setFiltersOpen(true);
              }}
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
            >
              <AdjustmentsHorizontalIcon />
              Filters
            </button>
            <label className="catalog-sort">
              <span className="sr-only">Sort by</span>
              <select
                aria-label="Sort by"
                value={params.get("sortBy") || ""}
                onChange={(e) => setParam("sortBy", e.target.value)}
              >
                {sortOptions.map(([value, text]) => (
                  <option key={value} value={value}>
                    {value ? text : "Sort by"}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </label>
            <div
              className="catalog-view-controls"
              role="group"
              aria-label="Product view"
            >
              <button
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Squares2X2Icon />
              </button>
              <button
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <ListBulletIcon />
              </button>
            </div>
          </div>
          <div className="catalog-gender-pills" aria-label="Filter by gender">
            {[
              ["", "All", "all"],
              ["men", "Men", "men"],
              ["women", "Women", "women"],
              ["kids", "Kids", "kids"],
            ].map(([value, text, count]) => (
              <button
                key={count}
                aria-pressed={(params.get("gender") || "") === value}
                onClick={() => setParam("gender", value)}
              >
                {text} (
                {state.loading || state.error
                  ? "…"
                  : (state.genderCounts[count] ?? "—")}
                )
              </button>
            ))}
          </div>
          {activeFilters.length > 0 && (
            <div className="catalog-active-filters" aria-label="Active filters">
              {activeFilters.map(([key, value]) => (
                <button
                  key={`${key}:${value}`}
                  onClick={() => removeFilter(key, value)}
                  aria-label={`Remove ${chipLabel(key, value)} filter`}
                >
                  {chipLabel(key, value)}
                  <XMarkIcon />
                </button>
              ))}
              <button className="catalog-clear" onClick={clearAll}>
                Clear all
              </button>
            </div>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {state.loading
              ? "Loading products"
              : state.error
                ? "Products could not be loaded"
                : `${state.total} products found`}
          </div>
          {state.loading ? (
            <div className="catalog-results catalog-loading" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} />
              ))}
            </div>
          ) : state.error ? (
            <div className="catalog-empty-state" role="alert">
              <h2>We couldn’t load the collection.</h2>
              <p>Please try again in a moment.</p>
              <button
                className="store-button"
                onClick={() => setRetry((value) => value + 1)}
              >
                Try again <ArrowUpRightIcon />
              </button>
            </div>
          ) : state.products.length === 0 ? (
            <div className="catalog-empty-state">
              <h2>No matches this time.</h2>
              <p>
                Try fewer filters or explore all shoes, apparel and accessories.
              </p>
              <button className="store-button" onClick={clearAll}>
                View all products <ArrowUpRightIcon />
              </button>
            </div>
          ) : (
            <div className={`catalog-results catalog-results-${view}`}>
              {state.products.map((product) => {
                const rating = Math.min(
                  5,
                  Math.max(0, Number(product.rating?.average) || 0),
                );
                const reviewCount = Number(product.rating?.total) || 0;
                const price = product.finalPrice ?? product.price;
                const isNew =
                  product.createdAt &&
                  new Date(product.createdAt) >
                    new Date(Date.now() - 30 * 86400000);
                const badge = product.isTrending
                  ? "Trending"
                  : product.discountPercentage > 0
                    ? `${product.discountPercentage}% off`
                    : isNew
                      ? "New"
                      : null;
                return (
                  <article
                    className="catalog-card"
                    key={product._id || product.slug}
                  >
                    <Link
                      className="catalog-card-link"
                      to={`/product/${product.slug}`}
                    >
                      <div className="catalog-card-visual">
                        {badge && (
                          <span
                            className={`catalog-badge ${product.isTrending ? "catalog-badge-trending" : ""}`}
                          >
                            {badge}
                          </span>
                        )}
                        <img
                          src={imageUrl(
                            product.variants?.[0]?.images?.[0] ||
                              product.featuredImg,
                          )}
                          alt={product.name}
                          loading="lazy"
                          width="936"
                          height="1170"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "/assets/editorial/image-unavailable.svg";
                          }}
                        />
                      </div>
                      <div className="catalog-card-copy">
                        <h2>{product.name}</h2>
                        <p className="catalog-card-gender">
                          {product.gender
                            ? label(product.gender)
                            : "Footwear & apparel"}
                        </p>
                        {reviewCount > 0 && (
                          <div
                            className="catalog-rating"
                            aria-label={`${rating} out of 5 stars, ${reviewCount} reviews`}
                          >
                            <span
                              className="catalog-stars"
                              style={{ "--rating": `${rating * 20}%` }}
                              aria-hidden="true"
                            >
                              ★★★★★
                            </span>
                            <span>({reviewCount})</span>
                          </div>
                        )}
                        {price != null && Number.isFinite(Number(price)) && (
                          <p className="catalog-price">
                            MRP : ₹ {Number(price).toLocaleString("en-IN")}
                            {product.finalPrice != null &&
                              product.finalPrice < product.price && (
                                <del>
                                  ₹
                                  {Number(product.price).toLocaleString(
                                    "en-IN",
                                  )}
                                </del>
                              )}
                          </p>
                        )}
                        <span className="catalog-card-arrow" aria-hidden="true">
                          <ArrowUpRightIcon />
                        </span>
                      </div>
                    </Link>
                    <button
                      className={`catalog-wishlist ${isInWishlist(product._id) ? "is-saved" : ""}`}
                      aria-label={`${isInWishlist(product._id) ? "Remove from" : "Add to"} wishlist: ${product.name}`}
                      aria-pressed={isInWishlist(product._id)}
                      disabled={wishlistLoading[product._id]}
                      onClick={(event) =>
                        handleWishlistToggle(product._id, event)
                      }
                    >
                      <HeartIcon />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
          {!state.loading && !state.error && state.pages > 1 && (
            <nav className="catalog-pagination" aria-label="Product pages">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", page - 1);
                  update(next, true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Previous
              </button>
              <span>
                Page {page} of {state.pages}
              </span>
              <button
                disabled={page >= state.pages}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", page + 1);
                  update(next, true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </main>
      <Footer />
      {filtersOpen && (
        <div
          className="catalog-filter-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setFiltersOpen(false);
          }}
        >
          <section
            className="catalog-filter-drawer"
            id="catalog-filters"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filter-title"
            ref={drawer}
          >
            <header>
              <div>
                <p className="store-eyebrow">MAKE IT YOURS</p>
                <h2 id="catalog-filter-title">Filters</h2>
              </div>
              <button
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <XMarkIcon />
              </button>
            </header>
            <div className="catalog-filter-scroll">
              {optionsError && (
                <p role="alert">
                  Some filter options couldn’t load.{" "}
                  <button onClick={() => setRetry((value) => value + 1)}>
                    Try again
                  </button>
                </p>
              )}
              <FilterFields
                params={draft}
                onChange={setDraft}
                options={options}
              />
              {draftError && <p role="alert">{draftError}</p>}
            </div>
            <footer>
              <button className="catalog-control" onClick={clearAll}>
                Clear all
              </button>
              <button className="store-button" onClick={applyFilters}>
                Apply filters <ArrowUpRightIcon />
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
