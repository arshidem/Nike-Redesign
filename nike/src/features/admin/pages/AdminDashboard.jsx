import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Squares2X2Icon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  UserIcon,
  ChartBarIcon,
  TicketIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { AllProducts } from "../components/AllProducts";
import { AllOrders } from "../components/AllOrders";
import { AllUsers } from "../components/AllUsers";
import { Dashboard } from "../components/Dashboard";
import { Reports } from "../components/Reports";
import Coupon from "../components/Coupon";
import "../../../css/admin-dashboard.css";

const sections = [
  ["dashboard", "Dashboard", Squares2X2Icon],
  ["products", "Products", ShoppingBagIcon],
  ["orders", "Orders", ArchiveBoxIcon],
  ["users", "Users", UserIcon],
  ["reports", "Reports", ChartBarIcon],
  ["coupon", "Coupons", TicketIcon],
];
export default function AdminDashboard() {
  const location = useLocation(),
    navigate = useNavigate();
  const active = sections.some(([key]) => key === location.hash.slice(1))
    ? location.hash.slice(1)
    : "dashboard";
  const [mobileOpen, setMobileOpen] = useState(false),
    [orderCount, setOrderCount] = useState(null);
  const menuButton = useRef(null),
    sidebar = useRef(null);
  useEffect(() => setMobileOpen(false), [location.hash, location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector("button")?.focus();
    const close = () => {
      setMobileOpen(false);
      menuButton.current?.focus();
    };
    const keydown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const links = [...sidebar.current.querySelectorAll("button, a")];
        if (event.shiftKey && document.activeElement === links[0]) {
          event.preventDefault();
          links.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === links.at(-1)) {
          event.preventDefault();
          links[0]?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
    };
  }, [mobileOpen]);
  const switchView = (key) => navigate(`/admin#${key}`);
  const content = {
    dashboard: <Dashboard onSummary={setOrderCount} />,
    products: <AllProducts navigate={navigate} setActiveView={switchView} />,
    orders: <AllOrders navigate={navigate} setActiveView={switchView} />,
    users: <AllUsers navigate={navigate} setActiveView={switchView} />,
    reports: <Reports navigate={navigate} setActiveView={switchView} />,
    coupon: <Coupon navigate={navigate} setActiveView={switchView} />,
  };
  return (
    <div className={`admin-shell${mobileOpen ? " admin-drawer-open" : ""}`}>
      <div className="admin-mobile-header">
        <button
          ref={menuButton}
          type="button"
          aria-label="Open admin menu"
          aria-controls="admin-sidebar"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Bars3Icon />
        </button>
        <span>NIKE / ADMIN</span>
        <Link to="/home" aria-label="Return to store">
          <HomeIcon />
        </Link>
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="admin-drawer-backdrop"
          aria-label="Close admin menu"
          onClick={() => {
            setMobileOpen(false);
            menuButton.current?.focus();
          }}
        />
      )}
      <aside
        id="admin-sidebar"
        ref={sidebar}
        className="admin-sidebar"
        aria-label="Admin navigation"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
      >
        <div className="admin-sidebar-brand">
          <Link to="/admin">
            <img src="/assets/logo/nikeLogo.png" alt="" />
            <span>
              <strong>NIKE</strong>
              <small>Admin Panel</small>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => {
              setMobileOpen(false);
              menuButton.current?.focus();
            }}
          >
            <XMarkIcon />
          </button>
        </div>
        <nav aria-label="Admin sections">
          {sections.map(([key, label, Icon]) => (
            <Link
              key={key}
              to={`/admin#${key}`}
              aria-current={active === key ? "page" : undefined}
            >
              <Icon />
              <span>{label}</span>
              {key === "orders" && orderCount != null && (
                <small>{orderCount.toLocaleString("en-IN")}</small>
              )}
            </Link>
          ))}
        </nav>
        <img
          className="admin-sidebar-watermark"
          src="/assets/logo/nikeLogo.png"
          alt=""
        />
        <Link className="admin-sidebar-home" to="/home">
          <HomeIcon />
          Home
        </Link>
      </aside>
      <main className="admin-main" id="admin-content">
        {content[active]}
      </main>
    </div>
  );
}
