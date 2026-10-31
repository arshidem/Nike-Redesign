import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ShoppingBagIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import useCartServices from "../services/cartServices";
import { useAppContext } from "../../../context/AppContext";
import "../../../css/mini-cart.css";
const money = (value) => `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
export default function MiniCart() {
  const { updateItemQuantity, removeItemFromCart } = useCartServices();
  const { token, backendUrl } = useAppContext();
  const [cart, setCart] = useState({ items: [] }),
    [added, setAdded] = useState(null),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 80, right: 24 });
  const panel = useRef(null),
    previousFocus = useRef(null),
    inFlight = useRef(false);
  const location = useLocation(),
    reduced = useReducedMotion();
  const close = () => setOpen(false);
  useEffect(() => {
    const show = (event) => {
      previousFocus.current = document.activeElement;
      setCart(event.detail.cart);
      setAdded(event.detail.added);
      setError("");
      setOpen(true);
    };
    const sync = (event) => {
      if (event.detail?.items) setCart(event.detail);
    };
    window.addEventListener("cartAdded", show);
    window.addEventListener("cartUpdated", sync);
    return () => {
      window.removeEventListener("cartAdded", show);
      window.removeEventListener("cartUpdated", sync);
    };
  }, []);
  useEffect(close, [location.pathname, location.search, token]);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const bag = [...document.querySelectorAll('a[href="/bag"]')].find(
          (el) => el.getBoundingClientRect().width > 0,
        ),
        rect = bag?.getBoundingClientRect();
      setPosition({
        top: rect
          ? Math.min(Math.max(rect.bottom + 12, 16), window.innerHeight - 220)
          : 80,
        right: rect ? Math.max(16, window.innerWidth - rect.right) : 24,
      });
    };
    place();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const nodes = [
            ...panel.current.querySelectorAll("button:not(:disabled), a[href]"),
          ],
          first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", place);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", place);
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, [open]);
  const item = cart.items.find(
    (entry) =>
      entry.productId === added?.productId &&
      entry.variantId === added?.variantId &&
      entry.size === added?.size,
  );
  const count = cart.items.reduce(
    (sum, entry) => sum + Number(entry.quantity || 0),
    0,
  );
  const subtotal = cart.items.reduce(
    (sum, entry) =>
      sum + Number(entry.price || 0) * Number(entry.quantity || 0),
    0,
  );
  const mutate = async (quantity) => {
    if (!item || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const id = token
      ? item._id
      : `${item.productId}${item.variantId}${item.size}`;
    try {
      const response =
          quantity == null
            ? await removeItemFromCart(id)
            : await updateItemQuantity(id, quantity),
        updated = response?.cart ?? response;
      if (!Array.isArray(updated?.items))
        throw new Error("Please try updating your bag again.");
      setCart(updated);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Couldn’t update your bag. Try again.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const image = (path) => {
    if (!path || typeof path !== "string")
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="mini-cart-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          <div
            className="mini-cart-backdrop"
            onClick={close}
            aria-hidden="true"
          />
          <motion.section
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mini-cart-title"
            className="mini-cart"
            style={{
              "--mini-top": `${position.top}px`,
              "--mini-right": `${position.right}px`,
            }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{
              duration: reduced ? 0 : 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <header className="mini-cart-header">
              <ShoppingBagIcon />
              <h2 id="mini-cart-title">Added to Bag</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close mini cart"
              >
                <XMarkIcon />
              </button>
            </header>
            <div className="mini-cart-body">
              {item ? (
                <div className="mini-cart-item" aria-busy={busy}>
                  <img
                    src={image(item.image)}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/assets/editorial/image-unavailable.svg";
                    }}
                  />
                  <div className="mini-cart-info">
                    <h3>{item.name}</h3>
                    <p>
                      Size: {item.size} <span>|</span> {item.color}
                    </p>
                    <strong>{money(item.price)}</strong>
                    <div className="mini-cart-controls">
                      <div className="mini-cart-quantity">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={busy || item.quantity <= 1}
                          onClick={() => mutate(item.quantity - 1)}
                        >
                          <MinusIcon />
                        </button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={
                            busy ||
                            (item.stock != null && item.quantity >= item.stock)
                          }
                          onClick={() => mutate(item.quantity + 1)}
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="mini-cart-remove"
                        aria-label="Remove item from bag"
                        disabled={busy}
                        onClick={() => mutate(null)}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mini-cart-empty" role="status">
                  Item removed.{" "}
                  {count
                    ? "Your other favorites are still in the bag."
                    : "Your bag is empty."}
                </p>
              )}
              {error && (
                <p className="mini-cart-error" role="alert">
                  {error}
                </p>
              )}
              <div className="mini-cart-summary" aria-live="polite">
                <span>
                  Bag Summary ({count} {count === 1 ? "item" : "items"})
                </span>
                <strong>{money(subtotal)}</strong>
              </div>
              {count > 0 && (
                <Link
                  className="mini-cart-checkout"
                  to="/checkout"
                  onClick={close}
                >
                  Checkout <ArrowRightIcon />
                </Link>
              )}
              <Link className="mini-cart-view" to="/bag" onClick={close}>
                View Bag
              </Link>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
