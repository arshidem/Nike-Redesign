import NikeSelect from "../../../shared/ui/NikeSelect";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  CubeIcon,
  Square3Stack3DIcon,
  ShoppingCartIcon,
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BarsArrowDownIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import "../../../css/product-management.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const defaults = {
  category: "",
  gender: "",
  model: "",
  activityType: "",
  sportType: "",
  minRating: "",
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  color: "",
  size: "",
  isFeatured: false,
  isTrending: false,
  newArrival: false,
};
const optionDefaults = {
  categories: [],
  genders: [],
  models: [],
  activityTypes: [],
  sportTypes: [],
  colors: [],
  sizesByCategory: {},
};
const sorting = [
  ["", "Newest first"],
  ["nameAsc", "Name A–Z"],
  ["nameDesc", "Name Z–A"],
  ["priceAsc", "Price: low to high"],
  ["priceDesc", "Price: high to low"],
  ["sold", "Most sold"],
];
const stock = (product) =>
  (product.variants || []).reduce(
    (sum, variant) =>
      sum +
      (variant.sizes || []).reduce(
        (total, size) => total + Number(size.stock || 0),
        0,
      ),
    0,
  );
function Dialog({ title, onClose, locked = false, children }) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (
      panel.current?.querySelector(
        "button:not(:disabled),select:not(:disabled),input:not(:disabled)",
      ) || panel.current
    )?.focus({ preventScroll: true });
    const keydown = (event) => {
      if (event.key === "Escape" && !locked) onClose();
      if (event.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll(
            "button:not(:disabled),select:not(:disabled),input:not(:disabled)",
          ),
        ];
        if (!nodes.length) {
          event.preventDefault();
          panel.current?.focus({ preventScroll: true });
          return;
        }
        if (event.shiftKey && document.activeElement === nodes[0]) {
          event.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
          event.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [locked]);
  return createPortal(
    <div className="pm-modal-layer">
      <div
        className="pm-modal-backdrop"
        onClick={() => !locked && onClose()}
        aria-hidden="true"
      />
      <section
        ref={panel}
        tabIndex={-1}
        className="pm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <small>MAKE IT YOURS</small>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            disabled={locked}
            onClick={onClose}
          >
            <XMarkIcon />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
export const AllProducts = () => {
  const service = useProductService(),
    latest = useRef(service);
  latest.current = service;
  const { backendUrl, token } = useAppContext();
  const [products, setProducts] = useState([]),
    [pagination, setPagination] = useState({}),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState(null),
    [statsError, setStatsError] = useState(false);
  const [options, setOptions] = useState(optionDefaults),
    [optionsLoading, setOptionsLoading] = useState(true),
    [optionsError, setOptionsError] = useState(false);
  const [draft, setDraft] = useState(defaults),
    [filters, setFilters] = useState(defaults),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("");
  const [showFilters, setShowFilters] = useState(false),
    [filterError, setFilterError] = useState(""),
    [view, setView] = useState(() =>
      window.innerWidth < 768 ? "grid" : "table",
    );
  const [selected, setSelected] = useState([]),
    [deleting, setDeleting] = useState(false),
    [deleteIds, setDeleteIds] = useState(null),
    [menu, setMenu] = useState(null);
  const deleteLock = useRef(false),
    checkAll = useRef(null),
    menuRef = useRef(null);
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, query]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setSelected([]);
    setMenu(null);
    latest.current
      .fetchProducts(
        {
          ...filters,
          isFeatured: filters.isFeatured || undefined,
          isTrending: filters.isTrending || undefined,
          newArrival: filters.newArrival || undefined,
          search: query,
          searchFields: "management",
          sortBy: sort,
          page,
          limit: 10,
        },
        { signal: controller.signal, throwOnError: true },
      )
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result?.products))
          throw new Error("Unexpected product response");
        const totalPages = Number(result.pagination?.totalPages || 0);
        if (totalPages > 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }
        if (!totalPages && page > 1) {
          setPage(1);
          return;
        }
        setProducts(result.products);
        setPagination(result.pagination || {});
      })
      .catch((err) => {
        if (active && !controller.signal.aborted)
          setError(
            err?.response?.data?.message ||
              err.message ||
              "Couldn’t load products.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [backendUrl, token, filters, query, sort, page, refresh]);
  useEffect(() => {
    let active = true;
    setStats(null);
    setStatsError(false);
    setOptionsLoading(true);
    setOptionsError(false);
    latest.current
      .fetchProductAnalytics()
      .then((data) => {
        if (!data) throw new Error();
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setStatsError(true);
      });
    latest.current
      .fetchFilterOptions()
      .then((data) => {
        if (!data) throw new Error();
        if (active) setOptions({ ...optionDefaults, ...data });
      })
      .catch(() => {
        if (active) setOptionsError(true);
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backendUrl, token, refresh]);
  useEffect(() => {
    if (checkAll.current)
      checkAll.current.indeterminate =
        selected.length > 0 && selected.length < products.length;
  }, [selected, products, view]);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector("a,button")?.focus({ preventScroll: true });
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (
        event.type === "pointerdown" &&
        menuRef.current?.contains(event.target)
      )
        return;
      if (event.type === "keydown") menu.trigger?.focus({ preventScroll: true });
      setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);
  const toggle = (id) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  const reset = () => {
    setDraft(defaults);
    setFilters(defaults);
    setSearch("");
    setQuery("");
    setSort("");
    setPage(1);
    setFilterError("");
    setShowFilters(false);
  };
  const apply = (event) => {
    event.preventDefault();
    if (
      (draft.minPrice !== "" && Number(draft.minPrice) < 0) ||
      (draft.maxPrice !== "" &&
        (Number(draft.maxPrice) < 0 ||
          Number(draft.maxPrice) < Number(draft.minPrice || 0)))
    ) {
      setFilterError("Enter a valid price range.");
      return;
    }
    setFilters({ ...draft });
    setPage(1);
    setShowFilters(false);
  };
  const remove = async () => {
    if (deleteLock.current || !deleteIds?.length) return;
    deleteLock.current = true;
    setDeleting(true);
    try {
      const result = await latest.current.bulkDeleteProducts(deleteIds);
      toast.success(
        result.message ||
          `${result.deletedCount ?? deleteIds.length} products deleted`,
      );
      setDeleteIds(null);
      setSelected([]);
      setRefresh((value) => value + 1);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          "Couldn’t delete products. Please try again.",
      );
    } finally {
      setDeleting(false);
      deleteLock.current = false;
    }
  };
  const image = (path) => {
    if (typeof path !== "string" || !path)
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };
  const fallback = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/assets/editorial/image-unavailable.svg";
  };
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== "" && value !== false,
  ).length;
  const summary = [
    ["Total Products", CubeIcon, stats?.totalProducts],
    ["Total Variants", Square3Stack3DIcon, stats?.totalVariants],
    [
      "Total Sold",
      ShoppingCartIcon,
      typeof stats?.totalUnitsSold === "object"
        ? stats.totalUnitsSold.allTime
        : stats?.totalUnitsSold,
    ],
    [
      "Average Rating",
      StarIcon,
      stats?.averageRating != null
        ? Number(stats.averageRating).toFixed(1)
        : null,
    ],
  ];
  const details = (product) => (
    <Link
      className="pm-product-link"
      to={`/admin/product/${product.slug}`}
      state={{ fromView: "products" }}
    >
      <img
        src={image(product.variants?.[0]?.images?.[0] || product.featuredImg)}
        alt=""
        onError={fallback}
      />
      <span>
        <strong>{product.name}</strong>
        <small>ID: {product._id}</small>
        {product.model && <small>Model: {product.model}</small>}
      </span>
    </Link>
  );
  const finalPrice = (product) => {
    const price = Number(product.finalPrice ?? product.price),
      discount =
        Number(product.price) > price
          ? Math.round((1 - price / Number(product.price)) * 100)
          : 0;
    return (
      <span className="pm-final-price">
        {money(price)}
        {discount > 0 && <mark>{discount}% OFF</mark>}
      </span>
    );
  };
  const rating = (product) => (
    <span className="pm-rating">
      <StarIcon />
      {Number(product.rating?.average || 0).toFixed(1)}
      <small>({product.rating?.total || 0})</small>
    </span>
  );
  const variants = (product) => (
    <span className="pm-variants">
      {(product.variants || []).slice(0, 3).map((variant, index) => (
        <img
          key={variant._id || index}
          src={image(variant.images?.[0])}
          title={variant.color}
          alt={variant.color || "Variant"}
          onError={fallback}
        />
      ))}
      {product.variants?.length > 3 && (
        <small>+{product.variants.length - 3}</small>
      )}
    </span>
  );
  const status = (product) => (
    <span
      className={`pm-stock-badge${stock(product) > 0 ? "" : " pm-stock-empty"}`}
    >
      <i />
      {stock(product) > 0 ? "In stock" : "Out of stock"}
    </span>
  );
  const actions = (product) => (
    <div className="pm-row-actions">
      <Link
        to={`/admin/product/update/${product.slug}`}
        aria-label={`Edit ${product.name}`}
      >
        <PencilSquareIcon />
      </Link>
      <button
        type="button"
        aria-label={`More actions for ${product.name}`}
        aria-expanded={menu?.product._id === product._id}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setMenu({
            trigger: event.currentTarget,
            product,
            top:
              rect.bottom + 130 > window.innerHeight
                ? rect.top - 125
                : rect.bottom + 6,
            left: Math.min(rect.right - 175, window.innerWidth - 185),
          });
        }}
      >
        <EllipsisVerticalIcon />
      </button>
    </div>
  );
  const change = (key, value) =>
    setDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "category" ? { size: "" } : {}),
    }));
  const filterSelect = (label, key, values, emptyLabel) => (
    <label key={key}>
      {label}
      <NikeSelect
        aria-label={label}
        value={draft[key]}
        onChange={(event) => change(key, event.target.value)}
        disabled={optionsLoading || (key === "size" && !draft.category)}
      >
        <option value="">{emptyLabel || `All ${label.toLowerCase()}`}</option>
        {values.map((value) => (
          <option value={value} key={value}>
            {value}
          </option>
        ))}
      </NikeSelect>
    </label>
  );
  return (
    <section className="pm-page">
      <nav className="pm-breadcrumb" aria-label="Breadcrumb">
        <Link to="/admin#dashboard">Dashboard</Link>
        <ChevronRightIcon />
        <span>Products</span>
      </nav>
      <header className="pm-heading">
        <div>
          <h1>Product Management</h1>
          <p>Manage your product catalog, inventory, and pricing.</p>
        </div>
        <Link className="pm-add" to="/admin/create-product">
          <PlusIcon />
          Add New Product
        </Link>
      </header>
      <div className="pm-summary">
        {summary.map(([label, Icon, value], index) => (
          <div className="pm-summary-card" key={label}>
            <span className={`pm-summary-icon pm-summary-icon-${index}`}>
              <Icon />
            </span>
            <div>
              <strong>
                {statsError ? (
                  "—"
                ) : !stats ? (
                  <span className="pm-skeleton" />
                ) : value == null ? (
                  "—"
                ) : typeof value === "number" ? (
                  value.toLocaleString("en-IN")
                ) : (
                  value
                )}
              </strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      {statsError && (
        <p className="pm-notice" role="alert">
          Summary couldn’t load.{" "}
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Retry
          </button>
        </p>
      )}
      <div className="pm-toolbar">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <button type="submit" aria-label="Search products">
            <MagnifyingGlassIcon />
          </button>
          <input
            aria-label="Search products, ID, or model"
            placeholder="Search products, ID, or model…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                setQuery("");
                setPage(1);
              }}
            >
              <XMarkIcon />
            </button>
          )}
        </form>
        <div className="pm-toolbar-actions">
          <button
            type="button"
            onClick={() => {
              setDraft(filters);
              setFilterError("");
              setShowFilters(true);
            }}
            className={activeFilters ? "pm-filter-active" : ""}
          >
            <FunnelIcon />
            Filter{activeFilters > 0 && <small>{activeFilters}</small>}
          </button>
          <label className="pm-sort">
            <BarsArrowDownIcon />
            <NikeSelect
              aria-label="Sort products"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              {sorting.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </NikeSelect>
          </label>
          <button
            type="button"
            aria-label="Refresh products"
            disabled={loading || deleting}
            onClick={() => setRefresh((value) => value + 1)}
          >
            <ArrowPathIcon className={loading ? "pm-spinning" : ""} />
          </button>
          <div
            className="pm-view-controls"
            role="group"
            aria-label="Product view"
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <Squares2X2Icon />
            </button>
            <button
              type="button"
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <ListBulletIcon />
            </button>
          </div>
        </div>
      </div>
      {activeFilters > 0 && (
        <div className="pm-applied">
          <span>{activeFilters} filters applied</span>
          <button type="button" onClick={reset}>
            Clear all
          </button>
        </div>
      )}
      {selected.length > 0 && (
        <div className="pm-selection" role="status">
          <span>{selected.length} selected</span>
          <button
            type="button"
            onClick={() =>
              setSelected(
                selected.length === products.length
                  ? []
                  : products.map((product) => product._id),
              )
            }
          >
            {selected.length === products.length
              ? "Deselect all"
              : "Select page"}
          </button>
          <button
            type="button"
            className="pm-delete"
            disabled={deleting || loading}
            onClick={() => setDeleteIds([...selected])}
          >
            <TrashIcon />
            Delete selected
          </button>
        </div>
      )}
      {error ? (
        <div className="pm-empty" role="alert">
          <h2>Couldn’t load products</h2>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="pm-loading" role="status" aria-label="Loading products">
          {[0, 1, 2, 3, 4].map((key) => (
            <div className="pm-skeleton" key={key} />
          ))}
        </div>
      ) : !products.length ? (
        <div className="pm-empty">
          <h2>No products found</h2>
          <p>Try a different search or adjust your filters.</p>
          <button type="button" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : view === "table" ? (
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead>
              <tr>
                <th>
                  <input
                    ref={checkAll}
                    type="checkbox"
                    aria-label="Select all products on this page"
                    checked={
                      selected.length === products.length && products.length > 0
                    }
                    onChange={() =>
                      setSelected(
                        selected.length === products.length
                          ? []
                          : products.map((product) => product._id),
                      )
                    }
                  />
                </th>
                {[
                  "Product",
                  "Gender",
                  "Price",
                  "Final Price",
                  "Rating",
                  "Sold",
                  "Variants",
                  "Status",
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
                <th scope="col">
                  <span className="pm-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product._id}
                  className={
                    selected.includes(product._id) ? "pm-selected" : ""
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${product.name}`}
                      checked={selected.includes(product._id)}
                      onChange={() => toggle(product._id)}
                    />
                  </td>
                  <td>{details(product)}</td>
                  <td>
                    <span className={`pm-gender pm-gender-${product.gender}`}>
                      {product.gender}
                    </span>
                  </td>
                  <td>{money(product.price)}</td>
                  <td>{finalPrice(product)}</td>
                  <td>{rating(product)}</td>
                  <td>{Number(product.sold || 0).toLocaleString("en-IN")}</td>
                  <td>{variants(product)}</td>
                  <td>{status(product)}</td>
                  <td>{actions(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pm-grid">
          {products.map((product) => (
            <article
              className={`pm-grid-card${selected.includes(product._id) ? " pm-selected" : ""}`}
              key={product._id}
            >
              <div className="pm-grid-controls">
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.name}`}
                    checked={selected.includes(product._id)}
                    onChange={() => toggle(product._id)}
                  />
                </label>
                {status(product)}
              </div>
              {details(product)}
              <div className="pm-grid-meta">
                <span className={`pm-gender pm-gender-${product.gender}`}>
                  {product.gender}
                </span>
                {rating(product)}
              </div>
              <div className="pm-grid-pricing">
                <span>
                  <small>Price</small>
                  {money(product.price)}
                </span>
                <span>
                  <small>Final price</small>
                  {finalPrice(product)}
                </span>
                <span>
                  <small>Sold</small>
                  {product.sold || 0}
                </span>
              </div>
              <footer>
                {variants(product)}
                {actions(product)}
              </footer>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && (
        <footer className="pm-pagination">
          <span>
            {pagination.totalItems ?? products.length} products
            {products.length > 0
              ? ` · Page ${page} of ${Math.max(1, pagination.totalPages || 1)}`
              : ""}
          </span>
          {Number(pagination.totalPages) > 1 && (
            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </button>
            </div>
          )}
        </footer>
      )}
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="pm-action-menu"
            style={{ top: menu.top, left: Math.max(8, menu.left) }}
            role="group"
            aria-label={`Actions for ${menu.product.name}`}
          >
            <Link to={`/admin/product/${menu.product.slug}`}>
              <ArrowUpRightIcon />
              View product
            </Link>
            <Link to={`/admin/product/update/${menu.product.slug}`}>
              <PencilSquareIcon />
              Edit product
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteIds([menu.product._id]);
                setMenu(null);
              }}
            >
              <TrashIcon />
              Delete product
            </button>
          </div>,
          document.body,
        )}
      {showFilters && (
        <Dialog title="Product filters" onClose={() => setShowFilters(false)}>
          <form onSubmit={apply}>
            <div className="pm-filter-fields">
              {optionsLoading && <p role="status">Loading filter options…</p>}
              {optionsError && (
                <p role="alert">
                  Some filter options couldn’t load. Close and refresh to retry.
                </p>
              )}
              {filterSelect("Category", "category", options.categories)}
              {filterSelect("Gender", "gender", options.genders)}
              {filterSelect("Model", "model", options.models)}
              {filterSelect(
                "Activity Type",
                "activityType",
                options.activityTypes,
              )}
              {filterSelect("Sport Type", "sportType", options.sportTypes)}
              {filterSelect(
                "Minimum Rating",
                "minRating",
                [1, 2, 3, 4, 5],
                "Any rating",
              )}
              {filterSelect(
                "Minimum Discount",
                "minDiscount",
                [5, 10, 20, 30, 40, 50, 60, 70],
                "Any discount",
              )}
              {filterSelect("Color", "color", options.colors)}
              {filterSelect(
                "Size",
                "size",
                options.sizesByCategory?.[draft.category] || [],
                "All sizes",
              )}
              <label>
                Minimum price
                <input
                  type="number"
                  min="0"
                  placeholder="Min ₹"
                  value={draft.minPrice}
                  onChange={(event) => change("minPrice", event.target.value)}
                />
              </label>
              <label>
                Maximum price
                <input
                  type="number"
                  min="0"
                  placeholder="Max ₹"
                  value={draft.maxPrice}
                  onChange={(event) => change("maxPrice", event.target.value)}
                />
              </label>
              <div className="pm-filter-flags">
                {[
                  ["isFeatured", "Featured"],
                  ["isTrending", "Trending"],
                  ["newArrival", "New Arrival"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(event) => change(key, event.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            {filterError && (
              <p className="pm-filter-error" role="alert">
                {filterError}
              </p>
            )}
            <footer>
              <button type="button" onClick={reset}>
                Clear all
              </button>
              <button className="pm-primary" type="submit">
                Apply filters
              </button>
            </footer>
          </form>
        </Dialog>
      )}
      {deleteIds && (
        <Dialog
          title={`Delete ${deleteIds.length} product${deleteIds.length === 1 ? "" : "s"}?`}
          onClose={() => setDeleteIds(null)}
          locked={deleting}
        >
          <p className="pm-confirm-copy">
            This permanently deletes the selected products. This action cannot
            be undone.
          </p>
          <footer>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteIds(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pm-danger"
              disabled={deleting}
              onClick={remove}
            >
              {deleting ? "Deleting…" : "Delete products"}
            </button>
          </footer>
        </Dialog>
      )}
    </section>
  );
};
