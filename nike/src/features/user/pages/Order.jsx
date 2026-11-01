import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AppBar from "../../../shared/ui/AppBar";
import useOrderServices from "../services/orderServices";
import { useAppContext } from "../../../context/AppContext";
import Footer from "../components/Footer";
import "../../../css/customer-orders.css";

const statuses = [
  ["", "All Orders"],
  ["processing", "Processing"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
];
const icons = {
  processing: ClockIcon,
  shipped: TruckIcon,
  delivered: CheckCircleIcon,
  cancelled: XCircleIcon,
};
export default function Order() {
  const { backendUrl, token } = useAppContext();
  const service = useOrderServices(),
    latest = useRef(service);
  latest.current = service;
  const [collapsed, setCollapsed] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    let frameId = null;
    const update = () => {
      frameId = null;
      if (!titleRef.current) return;
      const bottom = titleRef.current.getBoundingClientRect().bottom;
      setCollapsed(bottom < 56);
    };

    const onScroll = () => {
      if (frameId == null) frameId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId != null) cancelAnimationFrame(frameId);
    };
  }, []);

  const [orders, setOrders] = useState([]),
    [counts, setCounts] = useState({}),
    [pagination, setPagination] = useState({}),
    [loading, setLoading] = useState(Boolean(token)),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, query]);
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    latest.current
      .getUserOrders(page, 10, { search: query, status })
      .then((result) => {
        if (!active) return;
        if (!result?.success)
          throw new Error(result?.error || "We couldn’t load your orders.");
        const pages = Number(result.pagination?.totalPages || 0);
        if (page > Math.max(1, pages)) {
          setPage(Math.max(1, pages));
          return;
        }
        setOrders(Array.isArray(result.orders) ? result.orders : []);
        setPagination(result.pagination || {});
        setCounts(result.statusCounts || {});
      })
      .catch((err) => {
        if (active) setError(err.message || "We couldn’t load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backendUrl, token, page, query, status, retry]);
  const image = (path) => {
    if (typeof path !== "string" || !path)
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };
  const reset = () => {
    setSearch("");
    setQuery("");
    setStatus("");
    setPage(1);
  };
  return (
    <div className="customer-orders-page">
      <AppBar fallback="/home" title="Your Orders" isScrolled={collapsed} />
      <main className="customer-orders-main">
        <header className="customer-orders-heading">
          <p>YOUR SPACE / ORDERS</p>
          <h1 ref={titleRef}>Your Orders</h1>
          <span>Track and manage your Nike orders.</span>
        </header>
        {!token ? (
          <section className="customer-orders-empty">
            <h2>Your orders are one sign-in away.</h2>
            <p>Sign in to track your purchases and deliveries.</p>
            <Link to="/signin" state={{ returnTo: "/orders" }}>
              Sign in
            </Link>
          </section>
        ) : (
          <>
            <form
              className="customer-orders-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(search.trim());
                setPage(1);
              }}
            >
              <MagnifyingGlassIcon />
              <input
                aria-label="Search orders by ID, product, or date"
                placeholder="Search orders by ID, product, or date"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear order search"
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
            <div
              className="customer-orders-pills"
              role="group"
              aria-label="Filter orders by status"
            >
              {statuses
                .filter(
                  ([key]) => !key || Number(counts[key]) > 0 || key === status,
                )
                .map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={status === key}
                    onClick={() => {
                      setStatus(key);
                      setPage(1);
                    }}
                  >
                    {label}
                    {counts[key || "all"] != null
                      ? ` (${counts[key || "all"]})`
                      : ""}
                  </button>
                ))}
            </div>
            {loading ? (
              <div
                className="customer-orders-loading"
                role="status"
                aria-label="Loading orders"
              >
                {[0, 1, 2].map((key) => (
                  <div key={key}>
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            ) : error ? (
              <section className="customer-orders-empty" role="alert">
                <h2>Your orders couldn’t load.</h2>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Try again
                </button>
              </section>
            ) : orders.length ? (
              <ul className="customer-orders-list">
                {orders.map((order, index) => {
                  const key = String(
                      order.status || "processing",
                    ).toLowerCase(),
                    Icon = icons[key] || ClockIcon,
                    date = new Date(order.createdAt),
                    first = order.items?.[0];
                  return (
                    <li key={order._id}>
                      <Link
                        className={`customer-order-card${index === 0 ? " customer-order-featured" : ""}`}
                        to={`/orders/${order._id}`}
                        aria-label={`View order ${String(order._id).slice(-6)}`}
                      >
                        <img
                          src={image(
                            first?.image || first?.product?.featuredImg,
                          )}
                          alt={
                            first?.title ||
                            first?.product?.name ||
                            "Order product"
                          }
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "/assets/editorial/image-unavailable.svg";
                          }}
                        />
                        <div className="customer-order-copy">
                          <strong>#{String(order._id).slice(-6)}</strong>
                          <p>
                            Placed on{" "}
                            {Number.isNaN(date.getTime())
                              ? "date unavailable"
                              : date.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  timeZone: "Asia/Kolkata",
                                })}
                          </p>
                          <b>
                            Total: ₹
                            {Number(order.totalPrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </b>
                        </div>
                        <span
                          className={`customer-order-status customer-order-${key}`}
                        >
                          <Icon />
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <ChevronRightIcon className="customer-order-chevron" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <section className="customer-orders-empty">
                <h2>
                  {query || status
                    ? "No matching orders."
                    : "Your next move starts here."}
                </h2>
                <p>
                  {query || status
                    ? "Try another search or clear your filters."
                    : "Your orders will appear here after your first purchase."}
                </p>
                {query || status ? (
                  <button type="button" onClick={reset}>
                    Clear filters
                  </button>
                ) : (
                  <Link to="/products">Explore products</Link>
                )}
              </section>
            )}
            {!loading && !error && pagination.totalPages > 1 && (
              <nav
                className="customer-orders-pagination"
                aria-label="Order pages"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
