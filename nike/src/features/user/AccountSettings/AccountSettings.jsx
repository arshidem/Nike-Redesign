import React from "react";
import {
  Link,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  UserIcon,
  MapPinIcon,
  LockClosedIcon,
  CubeIcon,
  HeartIcon,
  CreditCardIcon,
  TicketIcon,
  BellIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import AppBar from "../../../shared/ui/AppBar";
import { useAppContext } from "../../../context/AppContext";
import AccountDetails from "./AccountDetails";
import DeliveryAddresses from "./DeliveryAddresses";
import {
  Security,
  Payments,
  Offers,
  Notifications,
  Help,
  Privacy,
  Legal,
} from "./SettingsPages";
import { useSignOut } from "./SettingsUI";
import "../../../css/settings.css";
const groups = [
  [
    "Account",
    [
      [
        "Personal Information",
        "Name, email and phone",
        "/account/personal",
        UserIcon,
      ],
      [
        "Delivery Addresses",
        "Manage saved addresses",
        "/account/addresses",
        MapPinIcon,
      ],
      [
        "Sign-in & Security",
        "Email OTP and account access",
        "/account/security",
        LockClosedIcon,
      ],
    ],
  ],
  [
    "Shopping",
    [
      ["My Orders", "Order history and tracking", "/orders", CubeIcon],
      ["Wishlist", "Saved favourite products", "/wishlist", HeartIcon],
      [
        "Payment Methods",
        "Your secure checkout options",
        "/account/payments",
        CreditCardIcon,
      ],
      [
        "Coupons & Offers",
        "Available discounts and special offers",
        "/account/offers",
        TicketIcon,
      ],
    ],
  ],
  [
    "Preferences",
    [
      [
        "Notifications",
        "Order updates, offers and more",
        "/account/notifications",
        BellIcon,
      ],
      [
        "Help & Support",
        "FAQs and support requests",
        "/account/help",
        LifebuoyIcon,
      ],
      [
        "Privacy & Data",
        "Your data, downloads and account deletion",
        "/account/privacy",
        ShieldCheckIcon,
      ],
    ],
  ],
];
const headings = {
  personal: ["Personal Information", "Keep your account details up to date."],
  addresses: ["Delivery Addresses", "Your saved places, ready for checkout."],
  security: ["Sign-in & Security", "Manage how you access your account."],
  payments: ["Payment Methods", "A secure way to make your next move."],
  offers: ["Coupons & Offers", "Find an offer for your next order."],
  notifications: ["Notifications", "Choose how you hear from us."],
  help: ["Help & Support", "Find answers or send us a request."],
  privacy: ["Privacy & Data", "Stay in control of your account data."],
};
function SettingsHome() {
  const { busy, signOut } = useSignOut();
  return (
    <>
      <Link className="settings-my-account" to="/account/personal">
        <span className="settings-my-icon">
          <UserIcon />
        </span>
        <span>
          <strong>My Account</strong>
          <small>Personal information and preferences</small>
        </span>
        <img src="/assets/logo/nikeLogo.png" alt="" />
        <ChevronRightIcon />
      </Link>
      <div className="settings-groups">
        {groups.map(([title, rows]) => (
          <section key={title}>
            <h2 className="settings-section-label">{title}</h2>
            <div className="settings-menu-card">
              {rows.map(([label, description, to, Icon]) => (
                <Link key={to} to={to}>
                  <Icon />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <ChevronRightIcon />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <button
        type="button"
        className="settings-signout"
        disabled={busy}
        onClick={signOut}
      >
        <ArrowRightOnRectangleIcon />
        {busy ? "Signing out…" : "Sign Out"}
      </button>
    </>
  );
}
export default function AccountSettings({ publicPage }) {
  const { token } = useAppContext(),
    location = useLocation(),
    navigate = useNavigate();
  const page = publicPage || location.pathname.split("/")[2] || "",
    known = headings[page],
    legal = publicPage || page === "terms" || page === "policy",
    isPublic = legal || page === "help";
  const title = legal
      ? publicPage === "terms" || page === "terms"
        ? "Terms & Conditions"
        : "Privacy Policy"
      : known?.[0] || (!page ? "Settings." : "Page not found"),
    description = legal
      ? "How this storefront works."
      : known?.[1] ||
        (!page
          ? "Manage your account and preferences."
          : "Choose a page from your settings.");
  return (
    <div className="settings-page">
      <AppBar
        fallback="/home"
        onBack={page || publicPage ? () => navigate("/account") : undefined}
      />
      <main className="settings-main">
        <header className="settings-heading">
          <p>YOUR SPACE / ACCOUNT</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </header>
        {!token && !isPublic ? (
          <section className="settings-card settings-empty">
            <UserIcon />
            <h2>Your space starts here.</h2>
            <p>Sign in to manage your account and preferences.</p>
            <Link
              className="settings-primary"
              to="/signin"
              state={{ returnTo: location.pathname }}
            >
              Sign in
            </Link>
            <Link to="/account/help">Help & Support</Link>
          </section>
        ) : publicPage ? (
          <Legal type={publicPage} />
        ) : (
          <Routes>
            <Route index element={<SettingsHome />} />
            <Route path="personal" element={<AccountDetails />} />
            <Route path="addresses" element={<DeliveryAddresses />} />
            <Route path="security" element={<Security />} />
            <Route path="payments" element={<Payments />} />
            <Route path="offers" element={<Offers />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="help" element={<Help />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="policy" element={<Legal type="privacy" />} />
            <Route path="terms" element={<Legal type="terms" />} />
            <Route
              path="*"
              element={
                <Link className="settings-primary" to="/account">
                  Back to settings
                </Link>
              }
            />
          </Routes>
        )}
        <footer className="settings-footer">
          <Link to="/privacy">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms">Terms & Conditions</Link>
        </footer>
      </main>
    </div>
  );
}
