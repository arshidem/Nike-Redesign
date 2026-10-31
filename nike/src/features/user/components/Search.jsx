import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowUpRightIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAppContext } from "../../../context/AppContext";
import "../../../css/search.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const searchRoute = (query) =>
  `/products?search=${encodeURIComponent(query.trim())}`;

export default function Search({ isOpen, onClose }) {
  const { backendUrl } = useAppContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("idle");
  const [recent, setRecent] = useState([]);
  const [closing, setClosing] = useState(false);
  const [retry, setRetry] = useState(0);
  const input = useRef(null),
    panel = useRef(null),
    closeTimer = useRef(null);
  const reduced = useReducedMotion();
  const active = isOpen && !closing;
  const close = () => {
    if (closeTimer.current) return;
    setClosing(true);
    closeTimer.current = setTimeout(
      () => {
        closeTimer.current = null;
        onClose();
      },
      reduced ? 0 : 200,
    );
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setQuery("");
      setResults([]);
      setStatus("idle");
    }
  }, [isOpen]);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll(
            "a[href], button:not(:disabled), input",
          ),
        ];
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
      if (previous?.isConnected) previous.focus();
    };
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const term = query.trim();
    setResults([]);
    setCount(0);
    if (term.length < 2) {
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    let current = true;
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/products/search`, {
          params: { q: term },
          signal: controller.signal,
        });
        if (!current) return;
        const items = Array.isArray(response.data.results)
          ? response.data.results
          : [];
        setResults(items);
        setCount(Number(response.data.count ?? items.length));
        setStatus("ready");
        setRecent((previous) =>
          [term, ...previous.filter((value) => value !== term)].slice(0, 5),
        );
      } catch (error) {
        if (current && !controller.signal.aborted) setStatus("error");
      }
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, active, backendUrl, retry]);

  const submit = (event) => {
    event.preventDefault();
    if (query.trim().length >= 2) {
      navigate(searchRoute(query));
      close();
    }
  };
  const term = query.trim();
  const suggestions =
    term.length >= 2
      ? ["shoes", "runners", "blazers"].map((word) =>
          term.toLowerCase().endsWith(word) ? term : `${term} ${word}`,
        )
      : recent.length
        ? recent.slice(0, 3)
        : ["Nike shoes", "Nike runners", "Nike blazers"];
  const image = (path) => {
    if (!path || typeof path !== "string")
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          className="nike-search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <div
            className="nike-search-backdrop"
            aria-hidden="true"
            onClick={close}
          />
          <motion.section
            className="nike-search-panel"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search Nike products"
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <div className="nike-search-top">
              <Link
                to="/home"
                className="nike-search-brand"
                aria-label="Nike home"
                onClick={close}
              >
                <img src="/assets/logo/nikeLogo.png" alt="" />
              </Link>
              <form
                role="search"
                onSubmit={submit}
                className="nike-search-form"
              >
                <MagnifyingGlassIcon />
                <input
                  ref={input}
                  aria-label="Search products"
                  placeholder="Search Nike"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      input.current?.focus();
                    }}
                  >
                    <XMarkIcon />
                  </button>
                )}
              </form>
              <button
                type="button"
                className="nike-search-cancel"
                onClick={close}
              >
                Cancel
              </button>
            </div>
            <div className="nike-search-content">
              <nav
                className="nike-search-suggestions"
                aria-label={
                  term
                    ? "Suggested searches"
                    : recent.length
                      ? "Recent searches"
                      : "Popular searches"
                }
              >
                {suggestions.map((value, index) => (
                  <Link
                    key={`${value}-${index}`}
                    to={searchRoute(value)}
                    onClick={close}
                  >
                    <MagnifyingGlassIcon />
                    <span>
                      {term && value.startsWith(term) ? (
                        <>
                          {term}
                          <strong>{value.slice(term.length)}</strong>
                        </>
                      ) : (
                        value
                      )}
                    </span>
                    <ArrowUpRightIcon />
                  </Link>
                ))}
              </nav>
              {term.length >= 2 ? (
                <section
                  className="nike-search-products"
                  aria-label="Product results"
                  aria-busy={status === "loading"}
                >
                  <div className="nike-search-results-heading">
                    <h2>
                      Products {status === "ready" && <span>({count})</span>}
                    </h2>
                    <Link to={searchRoute(term)} onClick={close}>
                      View all <ArrowRightIcon />
                    </Link>
                  </div>
                  <p className="nike-search-status" role="status">
                    {status === "loading"
                      ? "Finding your next pair…"
                      : status === "ready"
                        ? `${count} ${count === 1 ? "product" : "products"} found`
                        : ""}
                  </p>
                  {status === "loading" ? (
                    <div className="nike-search-loading" aria-hidden="true">
                      {[0, 1, 2].map((value) => (
                        <div key={value}>
                          <span />
                          <span />
                        </div>
                      ))}
                    </div>
                  ) : status === "error" ? (
                    <div className="nike-search-empty" role="alert">
                      <p>We couldn’t search right now.</p>
                      <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                      >
                        Try again
                      </button>
                    </div>
                  ) : status === "ready" && !results.length ? (
                    <div className="nike-search-empty">
                      <p>No products found for “{term}”.</p>
                      <span>Try a style, color, or a different name.</span>
                    </div>
                  ) : (
                    <ul className="nike-search-results">
                      {results.slice(0, 5).map((product) => {
                        const price = Number(
                            product.finalPrice ?? product.price ?? 0,
                          ),
                          original = Number(product.price ?? price),
                          discount =
                            original > price
                              ? Math.round((1 - price / original) * 100)
                              : 0;
                        return (
                          <li key={product._id}>
                            <Link
                              className="nike-search-product"
                              to={`/product/${product.slug}`}
                              onClick={close}
                            >
                              <div className="nike-search-image">
                                <img
                                  src={image(
                                    product.image ||
                                      product.variants?.[0]?.images?.[0],
                                  )}
                                  alt=""
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src =
                                      "/assets/editorial/image-unavailable.svg";
                                  }}
                                />
                              </div>
                              <div className="nike-search-product-info">
                                <h3>{product.name}</h3>
                                <div className="nike-search-price">
                                  <strong>{money(price)}</strong>
                                  {discount > 0 && (
                                    <>
                                      <del>{money(original)}</del>
                                      <span>{discount}% OFF</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              ) : (
                <p className="nike-search-hint">
                  Find your next move. Search by style, product, or color.
                </p>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
