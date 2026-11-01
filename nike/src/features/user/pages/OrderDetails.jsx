import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ClockIcon,
  CheckIcon,
  TruckIcon,
  CubeIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import AppBar from "../../../shared/ui/AppBar";
import { useAppContext } from "../../../context/AppContext";
import useOrderServices from "../services/orderServices";
import Footer from "../components/Footer";
import "../../../css/order-details.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value, year = false) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        ...(year ? { year: "numeric" } : {}),
        timeZone: "Asia/Kolkata",
      });
};
const states = {
  processing: {
    title: "Processing",
    description: "Your order is being prepared.",
    Icon: ClockIcon,
    step: 0,
  },
  shipped: {
    title: "Shipped",
    description: "Your order is on its way.",
    Icon: TruckIcon,
    step: 1,
  },
  delivered: {
    title: "Delivered",
    description: "Your order has been delivered.",
    Icon: CheckCircleIcon,
    step: 2,
  },
  cancelled: {
    title: "Cancelled",
    description: "This order has been cancelled.",
    Icon: XCircleIcon,
    step: -1,
  },
};
export default function OrderDetails() {
  const { orderId } = useParams(),
    { backendUrl, token } = useAppContext();
  const service = useOrderServices(),
    latest = useRef(service);
  latest.current = service;
  const [order, setOrder] = useState(null),
    [loading, setLoading] = useState(Boolean(token)),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [collapsed, setCollapsed] = useState(false);
  const title = useRef(null),
    frame = useRef(null);
  useEffect(() => {
    if (!token) {
      setOrder(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setOrder(null);
    setError("");
    latest.current
      .getOrderById(orderId)
      .then((result) => {
        if (!active) return;
        if (!result?.success || !result.order)
          throw new Error(result?.error || "Order not found.");
        setOrder(result.order);
      })
      .catch((err) => {
        if (active) setError(err.message || "We couldn’t load this order.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, backendUrl, token, retry]);
  useEffect(() => {
    const update = () => {
      frame.current = null;
      const bottom = title.current?.getBoundingClientRect().bottom;
      setCollapsed(bottom != null && bottom < 56);
    };
    const onScroll = () => {
      if (frame.current == null) frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [orderId]);
  const image = (path) => {
    if (typeof path !== "string" || !path)
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    return `${(backendUrl || "").replace(/\/$/, "")}/${normalized.includes("uploads/") ? normalized.slice(normalized.indexOf("uploads/")) : normalized.replace(/^\/+/, "")}`;
  };
  const state = states[order?.status] || states.processing,
    StatusIcon = state.Icon,
    address = order?.shippingAddress || {},
    items = order?.items || [];
  const itemsPrice =
      order?.itemsPrice ??
      items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.price || 0),
        0,
      ),
    shipping = order?.shippingPrice ?? 0,
    tax = order?.taxPrice ?? 0,
    discount = order?.discountPrice ?? 0;
  const total = order?.totalPrice ?? itemsPrice + shipping + tax - discount;
  const center = (
    <div className={`od-brand-switch${collapsed ? " od-brand-collapsed" : ""}`}>
      <Link
        to="/home"
        className="od-nav-logo"
        aria-label="Nike home"
        aria-hidden={collapsed}
        tabIndex={collapsed ? -1 : undefined}
      >
        <img src="/assets/logo/nikeLogo.png" alt="" />
      </Link>
      <span className="od-nav-title" aria-hidden={!collapsed}>
        Order Details
      </span>
    </div>
  );
  return (
    <div className="od-page">
      <div className="od-sticky">
        <AppBar fallback="/orders" center={center} />
      </div>
      <main className="od-main">
        <header className="od-heading">
          <p>YOUR ORDERS</p>
          <h1 ref={title}>Order Details</h1>
          {order && <span>Order #{order._id}</span>}
        </header>
        {!token ? (
          <section className="od-empty">
            <h2>Sign in to see your order.</h2>
            <p>Your order details are available in your account.</p>
            <Link to="/signin" state={{ returnTo: `/orders/${orderId}` }}>
              Sign in
            </Link>
          </section>
        ) : loading ? (
          <div
            className="od-loading"
            role="status"
            aria-label="Loading order details"
          >
            <div />
            <div />
            <div />
          </div>
        ) : error ? (
          <section className="od-empty" role="alert">
            <h2>Your order couldn’t load.</h2>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
            <Link to="/orders">Back to orders</Link>
          </section>
        ) : (
          order && (
            <>
              <section
                className={`od-status-banner od-status-${order.status}`}
                aria-label={`Order status: ${state.title}`}
              >
                <StatusIcon />
                <div>
                  <h2>{state.title}</h2>
                  <p>{state.description}</p>
                </div>
                <img src="/assets/logo/nikeLogo.png" alt="" />
              </section>
              {state.step >= 0 && (
                <ol className="od-timeline" aria-label="Order tracking">
                  {[
                    ["Order Placed", "createdAt", CheckIcon],
                    ["Shipped", "shippedAt", TruckIcon],
                    ["Delivered", "deliveredAt", CubeIcon],
                  ].map(([label, key, Icon], index) => (
                    <li
                      key={key}
                      className={index <= state.step ? "od-step-complete" : ""}
                      aria-current={index === state.step ? "step" : undefined}
                    >
                      <span className="od-step-icon">
                        <Icon />
                      </span>
                      <strong>{label}</strong>
                      <span>{date(order[key])}</span>
                    </li>
                  ))}
                </ol>
              )}
              <section
                className="od-summary od-panel"
                aria-label="Order summary"
              >
                <dl className="od-payment">
                  <div>
                    <CalendarDaysIcon />
                    <span>
                      <dt>Order Date</dt>
                      <dd>{date(order.createdAt, true)}</dd>
                    </span>
                  </div>
                  <div>
                    <CreditCardIcon />
                    <span>
                      <dt>Payment Method</dt>
                      <dd>
                        {order.paymentMethod
                          ? String(order.paymentMethod).replace(
                              /^./,
                              (letter) => letter.toUpperCase(),
                            )
                          : "Not specified"}
                      </dd>
                    </span>
                  </div>
                  <div>
                    {order.isPaid ? <CheckCircleIcon /> : <ClockIcon />}
                    <span>
                      <dt>Payment Status</dt>
                      <dd>
                        {order.isPaid ? "Paid" : "Unpaid"}
                        {order.isPaid && order.paidAt && (
                          <small>on {date(order.paidAt, true)}</small>
                        )}
                      </dd>
                    </span>
                  </div>
                </dl>
                <dl className="od-totals">
                  <div>
                    <dt>Items Price</dt>
                    <dd>{money(itemsPrice)}</dd>
                  </div>
                  <div>
                    <dt>Shipping</dt>
                    <dd>{money(shipping)}</dd>
                  </div>
                  <div>
                    <dt>Tax</dt>
                    <dd>{money(tax)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="od-discount">
                      <dt>
                        Discount
                        {order.couponCode ? ` (${order.couponCode})` : ""}
                      </dt>
                      <dd>−{money(discount)}</dd>
                    </div>
                  )}
                  <div className="od-grand-total">
                    <dt>Total</dt>
                    <dd>{money(total)}</dd>
                  </div>
                </dl>
              </section>
              <section className="od-address od-panel">
                <MapPinIcon />
                <div>
                  <h2>Shipping Address</h2>
                  {Object.keys(address).length ? (
                    <address>
                      <strong>{address.fullName}</strong>
                      <span>{address.street}</span>
                      {address.street2 && <span>{address.street2}</span>}
                      <span>
                        {[address.city, address.state]
                          .filter(Boolean)
                          .join(", ")}
                        {address.postalCode ? ` – ${address.postalCode}` : ""}
                      </span>
                      <span>{address.country}</span>
                      {address.phone && (
                        <a
                          href={`tel:${String(address.phone).replace(/[^+\d]/g, "")}`}
                        >
                          <PhoneIcon />
                          {address.phone}
                        </a>
                      )}
                    </address>
                  ) : (
                    <p className="od-muted">Shipping address unavailable.</p>
                  )}
                </div>
              </section>
              <section className="od-products od-panel">
                <h2>
                  Products <span>({items.length})</span>
                </h2>
                {items.length ? (
                  <ul>
                    {items.map((item, index) => (
                      <li key={item._id || `${item.product}-${index}`}>
                        <img
                          src={image(item.image)}
                          alt={item.title || "Ordered product"}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              "/assets/editorial/image-unavailable.svg";
                          }}
                        />
                        <div>
                          <h3>{item.title || "Ordered product"}</h3>
                          <p>
                            Size: {item.size || "—"} <span>|</span> Color:{" "}
                            {item.color || "—"}
                          </p>
                          <p>
                            Qty: {item.quantity} <span>×</span>{" "}
                            {money(item.price)}
                          </p>
                        </div>
                        <strong>
                          {money(
                            Number(item.quantity || 0) *
                              Number(item.price || 0),
                          )}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="od-muted">Product details unavailable.</p>
                )}
              </section>
            </>
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
