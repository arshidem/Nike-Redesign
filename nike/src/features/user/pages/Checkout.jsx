import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Country, State } from "country-state-city";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  TagIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import useAddressService from "../services/addressServices";
import useOrderServices from "../services/orderServices";
import useCartServices from "../services/cartServices";
import { loadScript } from "../../../utils/loadRazorpayScript";
import { useAppContext } from "../../../context/AppContext";
import { CheckoutSkeleton } from "../../../shared/ui/Skeleton";
import "../../../css/checkout.css";

const blankAddress = {
  fullName: "",
  phone: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};
const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const countries = Country.getAllCountries();
const pendingKey = (id) => `nike_pending_payment_${id}`;
const addressPayload = (form) => ({
  fullName: form.fullName.trim(),
  phone: form.phone.trim(),
  street: [form.street.trim(), form.street2.trim()].filter(Boolean).join(", "),
  city: form.city.trim(),
  state: form.state.trim(),
  postalCode: form.postalCode.trim(),
  country: form.country,
});

function Field({ label, icon: Icon, error, className = "", children }) {
  return (
    <div className={`checkout-field-wrap ${className}`}>
      <label className={`checkout-field ${error ? "has-error" : ""}`}>
        {Icon && <Icon />}
        <span>
          <span className="checkout-field-label">{label}</span>
          {children}
        </span>
      </label>
      {error && (
        <p className="checkout-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, token, backendUrl } = useAppContext();
  const { getAddresses, addAddress, updateAddress } = useAddressService();
  const { initiatePayment, verifyPayment } = useOrderServices();
  const {
    getCart,
    applyCoupon,
    removeCoupon,
    updateItemQuantity,
    removeItemFromCart,
  } = useCartServices();
  const [cart, setCart] = useState({ items: [] });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [form, setForm] = useState(blankAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [addressWarning, setAddressWarning] = useState(false);
  const [retry, setRetry] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [busy, setBusy] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  const [pendingPayment, setPendingPayment] = useState(null);
  const lock = useRef(false);
  const receivedPayment = useRef(false);
  const savedFingerprint = useRef("");
  const formElement = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    setPendingPayment(null);
    setAddressWarning(false);
    const load = async () => {
      try {
        const [bag, saved] = await Promise.all([
          getCart(),
          token
            ? getAddresses().catch(() => {
                if (active) setAddressWarning(true);
                return [];
              })
            : Promise.resolve([]),
        ]);
        if (!active) return;
        if (!Array.isArray(bag?.items)) throw new Error("Invalid bag response");
        setCart(bag);
        const list = Array.isArray(saved) ? saved : [];
        setAddresses(list);
        const preferred = list.find((address) => address.isDefault) || list[0];
        if (preferred) {
          setSelectedAddress(preferred._id);
          setForm({ ...blankAddress, ...preferred });
        }
        if (user?._id) {
          try {
            const pending = JSON.parse(
              sessionStorage.getItem(pendingKey(user._id)) || "null",
            );
            if (
              pending?.razorpay_order_id &&
              pending?.razorpay_payment_id &&
              pending?.razorpay_signature
            )
              setPendingPayment(pending);
          } catch {
            /* Ignore malformed local recovery data. */
          }
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [backendUrl, token, user?._id, retry]);

  const items = cart.items || [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const subtotal =
    items.reduce(
      (sum, item) => sum + Math.round(Number(item.price) * 100) * item.quantity,
      0,
    ) / 100;
  const shippingKnown = cart.shippingFee != null;
  const shipping = Number(cart.shippingFee ?? 0),
    tax = Number(cart.tax ?? 0);
  const discount = cart.coupon?.applied
    ? Number(cart.coupon.discountAmount || 0)
    : 0;
  const total = Math.round((subtotal + shipping + tax - discount) * 100) / 100;
  const countryCode =
    countries.find((country) => country.name === form.country)?.isoCode || "IN";
  const states = State.getStatesOfCountry(countryCode);
  const unavailable = items.some(
    (item) => item.stockAvailable === false || item.stock === 0 || (item.stock != null && item.quantity > item.stock),
  );

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "country" ? { state: "" } : {}),
    }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };
  const validate = () => {
    const next = {};
    for (const [key, text] of [
      ["fullName", "Full name"],
      ["phone", "Phone number"],
      ["street", "Address"],
      ["city", "City"],
      ["state", "State"],
      ["postalCode", "PIN / postal code"],
      ["country", "Country"],
    ])
      if (!String(form[key]).trim()) next[key] = `${text} is required`;
    if (form.phone && !/^\+?[\d\s()-]{10,20}$/.test(form.phone.trim()))
      next.phone = "Enter a valid phone number";
    if (form.country === "India" && !/^\d{6}$/.test(form.postalCode))
      next.postalCode = "Enter a valid 6-digit PIN code";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formElement.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return false;
    }
    return true;
  };
  const imageUrl = (path) => {
    if (!path || typeof path !== "string")
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    const relative = normalized.includes("uploads/")
      ? normalized.slice(normalized.indexOf("uploads/"))
      : normalized.replace(/^\/+/, "");
    return `${(backendUrl || "").replace(/\/$/, "")}/${relative}`;
  };
  const mutateCart = async (operation) => {
    if (lock.current || pendingPayment) return;
    lock.current = true;
    setBusy("bag");
    try {
      const response = await operation();
      const next = response?.cart ?? response;
      if (response?.error || !Array.isArray(next?.items))
        throw new Error(response?.error || "Could not update your bag");
      setCart(next);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      setPaymentError(error.message || "Could not update your bag");
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  const confirm = async (proof) => {
    lock.current = true;
    setBusy("confirming");
    setPaymentError("");
    try {
      const result = await verifyPayment(proof);
      if (!result?.success || !result.data?.success || !result.data?.order)
        throw new Error(
          result?.error ||
            "Order confirmation is pending. Retry confirmation to check your existing payment.",
        );
      try {
        sessionStorage.removeItem(pendingKey(user._id));
      } catch {
        /* Confirmation succeeded even when browser storage is unavailable. */
      }
      setPendingPayment(null);
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success("Order confirmed. Thank you!");
      navigate("/orders", { state: { order: result.data.order } });
    } catch (error) {
      setPaymentError(
        error.message ||
          "Confirmation is pending. Retry your existing payment.",
      );
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  const pay = async () => {
    if (lock.current) return;
    if (pendingPayment) {
      await confirm(pendingPayment);
      return;
    }
    if (!token || !user?.email) {
      navigate("/signin", { state: { returnTo: "/checkout" } });
      return;
    }
    if (!validate()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      setPaymentError(
        "Your account needs a valid email address before checkout.",
      );
      return;
    }
    if (!items.length || unavailable || !shippingKnown) {
      setPaymentError(
        "Refresh your bag to confirm availability and delivery charges.",
      );
      return;
    }
    lock.current = true;
    setBusy("starting");
    setPaymentError("");
    receivedPayment.current = false;
    const address = addressPayload(form);
    try {
      const refreshed = await getCart();
      setCart(refreshed);
      if (!refreshed.items?.length || refreshed.items.some(item => item.stockAvailable === false || item.stock === 0 || (item.stock != null && item.quantity > item.stock))) {
        throw new Error("Stock changed. Reduce quantities or remove unavailable items before paying.");
      }
      if (!(await loadScript("https://checkout.razorpay.com/v1/checkout.js")))
        throw new Error(
          "The payment window couldn’t load. Check your connection and try again.",
        );
      if (saveAddress && savedFingerprint.current !== JSON.stringify(address)) {
        const existing = addresses.find(
          (entry) => entry._id === selectedAddress,
        );
        const same =
          existing &&
          Object.entries(address).every(
            ([key, value]) => existing[key] === value,
          );
        if (!same) {
          try {
            const saved = existing
              ? await updateAddress(existing._id, address)
              : await addAddress(address);
            if (saved?._id) {
              setSelectedAddress(saved._id);
              setAddresses((previous) => [
                ...previous.filter((entry) => entry._id !== saved._id),
                saved,
              ]);
            }
            savedFingerprint.current = JSON.stringify(address);
          } catch {
            toast.error(
              "Your address couldn’t be saved to your account. It will still be used for this delivery.",
            );
          }
        }
      }
      const initiated = await initiatePayment(
        Math.round(total * 100),
        `rcpt_${Date.now()}`,
        { address },
      );
      const order = initiated?.data?.data?.order,
        key = initiated?.data?.data?.keyId;
      if (!initiated?.success || !initiated.data?.success || !order?.id || !key)
        throw new Error(
          initiated?.error ||
            "Could not start payment. Please refresh checkout.",
        );
      if (order.amount !== Math.round(total * 100))
        throw new Error("Your total changed. Refresh checkout before paying.");
      const gateway = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Nike Redesign",
        description: "Your next move",
        order_id: order.id,
        prefill: {
          name: address.fullName,
          email: user.email,
          contact: address.phone,
        },
        theme: { color: "#182011" },
        handler: async (response) => {
          if (receivedPayment.current) return;
          receivedPayment.current = true;
          const proof = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          setPendingPayment(proof);
          try {
            sessionStorage.setItem(pendingKey(user._id), JSON.stringify(proof));
          } catch {
            /* Keep recovery available in component state. */
          }
          await confirm(proof);
        },
        modal: {
          ondismiss: () => {
            if (!receivedPayment.current) {
              lock.current = false;
              setBusy(null);
            }
          },
        },
      });
      gateway.on("payment.failed", (response) => {
        if (!receivedPayment.current) {
          setPaymentError(
            response?.error?.description || "Payment failed. Please try again.",
          );
          lock.current = false;
          setBusy(null);
        }
      });
      setBusy("gateway");
      gateway.open();
    } catch (error) {
      setPaymentError(error.message || "Could not open payment");
      lock.current = false;
      setBusy(null);
    }
  };
  const input = (name, autoComplete, extra = {}) => (
    <input
      name={name}
      autoComplete={autoComplete}
      value={form[name] || ""}
      onChange={change}
      aria-invalid={Boolean(errors[name])}
      disabled={Boolean(busy) || Boolean(pendingPayment)}
      {...extra}
    />
  );
  const header = (
    <header className="checkout-header">
      <button
        onClick={() =>
          window.history.state?.idx > 0 ? navigate(-1) : navigate("/bag")
        }
      >
        <ArrowLeftIcon />
        <span>Back</span>
      </button>
      <Link to="/home" aria-label="Nike home" className="checkout-brand">
        <img src="/assets/logo/nikeLogo.png" alt="" />
        <span>NIKE</span>
      </Link>
      <Link
        to="/bag"
        className="checkout-bag"
        aria-label={`Shopping bag, ${itemCount} items`}
      >
        <ShoppingBagIcon />
        {itemCount > 0 && <span>{itemCount}</span>}
      </Link>
    </header>
  );
  if (loading)
    return (
      <div className="checkout-shell">
        {header}
        <main className="checkout-loading">
          <CheckoutSkeleton />
        </main>
      </div>
    );
  if (loadError)
    return (
      <div className="checkout-shell">
        {header}
        <main className="checkout-empty" role="alert">
          <h1>Let’s get your order ready.</h1>
          <p>Checkout couldn’t load. Your bag is unchanged.</p>
          <button
            className="store-button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again <ArrowRightIcon />
          </button>
        </main>
      </div>
    );
  if (!items.length && !pendingPayment)
    return (
      <div className="checkout-shell">
        {header}
        <main className="checkout-empty">
          <h1>Your bag is empty.</h1>
          <p>Find your next favourite before checking out.</p>
          <Link className="store-button" to="/products">
            Explore the collection <ArrowRightIcon />
          </Link>
        </main>
      </div>
    );

  return (
    <div className="checkout-shell">
      {header}
      <main className="checkout-main">
        <section
          className="checkout-delivery"
          ref={formElement}
          aria-labelledby="checkout-delivery-title"
        >
          <p className="store-eyebrow">DELIVERY</p>
          <h1 id="checkout-delivery-title">Delivery Information.</h1>
          <p className="checkout-intro">
            Enter your details to get your order.
          </p>
          {!token && (
            <p className="checkout-notice">
              <Link to="/signin" state={{ returnTo: "/checkout" }}>
                Sign in
              </Link>{" "}
              to confirm your email and continue to payment.
            </p>
          )}
          <div className="checkout-email">
            <EnvelopeIcon />
            <div>
              <span>Email address</span>
              <strong>{user?.email || "Sign in to add your email"}</strong>
            </div>
            {token && user?.email && (
              <span className="checkout-email-check" aria-label="Account email">
                <CheckIcon />
              </span>
            )}
          </div>
          <p className="checkout-email-note">
            A confirmation email will be sent after checkout.
          </p>
          <div className="checkout-address-title">
            <h2>Delivery Address</h2>
            {token && (
              <label className="checkout-save">
                <span>Save to account</span>
                <input
                  type="checkbox"
                  checked={saveAddress}
                  disabled={Boolean(busy) || Boolean(pendingPayment)}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                />
                <i aria-hidden="true" />
              </label>
            )}
          </div>
          {addressWarning && (
            <p className="checkout-notice">
              Saved addresses couldn’t load. You can enter your delivery details
              below.
            </p>
          )}
          {addresses.length > 0 && (
            <label className="checkout-saved-address">
              Saved address
              <select
                aria-label="Saved address"
                value={selectedAddress}
                disabled={Boolean(busy) || Boolean(pendingPayment)}
                onChange={(event) => {
                  const address = addresses.find(
                    (entry) => entry._id === event.target.value,
                  );
                  setSelectedAddress(event.target.value);
                  setForm(
                    address ? { ...blankAddress, ...address } : blankAddress,
                  );
                  setErrors({});
                }}
              >
                <option value="">Use a new address</option>
                {addresses.map((address) => (
                  <option key={address._id} value={address._id}>
                    {address.fullName} · {address.city} · {address.postalCode}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="checkout-address-grid">
            <Field label="Full name" icon={UserIcon} error={errors.fullName}>
              {input("fullName", "name")}
            </Field>
            <Field label="Phone number" icon={PhoneIcon} error={errors.phone}>
              {input("phone", "tel", { type: "tel", inputMode: "tel" })}
            </Field>
            <Field
              label="Address line 1"
              icon={MapPinIcon}
              error={errors.street}
              className="checkout-field-full"
            >
              {input("street", "address-line1")}
            </Field>
            <Field
              label="Address line 2 (Optional)"
              icon={BuildingOfficeIcon}
              className="checkout-field-full"
            >
              {input("street2", "address-line2")}
            </Field>
            <Field
              label="City"
              error={errors.city}
              className="checkout-field-full"
            >
              {input("city", "address-level2")}
            </Field>
            <div className="checkout-region-row">
              <Field label="State" error={errors.state}>
                {states.length ? (
                  <select
                    name="state"
                    aria-invalid={Boolean(errors.state)}
                    value={form.state}
                    onChange={change}
                    autoComplete="address-level1"
                    disabled={Boolean(busy) || Boolean(pendingPayment)}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  input("state", "address-level1")
                )}
              </Field>
              <Field
                label={countryCode === "IN" ? "PIN code" : "Postal code"}
                error={errors.postalCode}
              >
                {input("postalCode", "postal-code", {
                  inputMode: countryCode === "IN" ? "numeric" : "text",
                })}
              </Field>
              <Field label="Country" error={errors.country}>
                <select
                  name="country"
                  value={form.country}
                  onChange={change}
                  autoComplete="country-name"
                  disabled={Boolean(busy) || Boolean(pendingPayment)}
                >
                  {countries.map((country) => (
                    <option key={country.isoCode} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </section>
        <section
          className="checkout-order"
          aria-labelledby="checkout-order-title"
        >
          <p className="store-eyebrow">YOUR ORDER</p>
          <div className="checkout-order-heading">
            <h2 id="checkout-order-title">Review your cart.</h2>
            <span>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <ul className="checkout-items">
            {items.map((item) => {
              const id =
                token && item._id
                  ? item._id
                  : `${item.productId}${item.variantId}${item.size}`;
              return (
                <li key={id}>
                  <img
                    src={imageUrl(item.image)}
                    alt={item.name}
                    width="936"
                    height="1170"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/assets/editorial/image-unavailable.svg";
                    }}
                  />
                  <div className="checkout-item-info">
                    <h3>{item.name}</h3>
                    <p>
                      {item.gender
                        ? item.gender.charAt(0).toUpperCase() +
                          item.gender.slice(1)
                        : ""}
                      {item.color ? ` | ${item.color}` : ""}
                    </p>
                    <p>Size: {item.size}</p>
                    {item.stock != null && item.quantity > item.stock && <p role="status">Only {item.stock} available. Reduce quantity or remove this item.</p>}
                  </div>
                  <div className="checkout-item-actions">
                    <div className="checkout-quantity">
                      <button
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={
                          Boolean(busy) ||
                          Boolean(pendingPayment) ||
                          item.quantity <= 1
                        }
                        onClick={() =>
                          mutateCart(() =>
                            updateItemQuantity(id, item.quantity - 1),
                          )
                        }
                      >
                        <MinusIcon />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={
                          Boolean(busy) ||
                          Boolean(pendingPayment) ||
                          (item.stock != null && item.quantity >= item.stock)
                        }
                        onClick={() =>
                          mutateCart(() =>
                            updateItemQuantity(id, item.quantity + 1),
                          )
                        }
                      >
                        <PlusIcon />
                      </button>
                    </div>
                    <button
                      className="checkout-remove-item"
                      aria-label={`Remove ${item.name}`}
                      disabled={Boolean(busy) || Boolean(pendingPayment)}
                      onClick={() => mutateCart(() => removeItemFromCart(id))}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <strong className="checkout-item-price">
                    {currency(item.price * item.quantity)}
                  </strong>
                </li>
              );
            })}
          </ul>
          <div className="checkout-coupon">
            <TagIcon />
            <label>
              <span>Discount code</span>
              <input
                aria-label="Discount code"
                placeholder="Enter your code"
                value={cart.coupon?.applied ? cart.coupon.code : couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                disabled={
                  Boolean(busy) ||
                  Boolean(pendingPayment) ||
                  Boolean(cart.coupon?.applied) ||
                  !token
                }
              />
            </label>
            <button
              disabled={
                Boolean(busy) ||
                Boolean(pendingPayment) ||
                !token ||
                (!cart.coupon?.applied && !couponCode.trim())
              }
              onClick={() =>
                mutateCart(() =>
                  cart.coupon?.applied
                    ? removeCoupon()
                    : applyCoupon(couponCode.trim().toUpperCase()),
                )
              }
            >
              {cart.coupon?.applied ? "Remove" : "Apply"}
              <ChevronRightIcon />
            </button>
          </div>
          <dl className="checkout-totals">
            <div>
              <dt>
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </dt>
              <dd>{currency(subtotal)}</dd>
            </div>
            <div>
              <dt>Estimated Delivery &amp; Handling</dt>
              <dd>{shippingKnown ? currency(shipping) : "After sign-in"}</dd>
            </div>
            {tax > 0 && (
              <div>
                <dt>Tax</dt>
                <dd>{currency(tax)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="checkout-discount">
                <dt>Discount ({cart.coupon.code})</dt>
                <dd>−{currency(discount)}</dd>
              </div>
            )}
            <div className="checkout-total">
              <dt>Total</dt>
              <dd>{currency(total)}</dd>
            </div>
          </dl>
          {pendingPayment && (
            <div className="checkout-confirmation-notice">
              <strong>Your payment needs confirmation.</strong>
              <p>
                Retry confirmation checks your existing payment and completes
                your order.
              </p>
            </div>
          )}
          {paymentError && (
            <p className="checkout-payment-error" role="alert">
              {paymentError}
            </p>
          )}
          {unavailable && !pendingPayment && <p role="status">Reduce quantities or remove unavailable items to continue.</p>}
          <button
            className="checkout-pay"
            aria-label={
              pendingPayment
                ? "Retry payment confirmation"
                : token
                  ? "Continue to Payment"
                  : "Sign in to continue"
            }
            aria-busy={Boolean(busy)}
            disabled={Boolean(busy) || (!pendingPayment && unavailable)}
            onClick={pay}
          >
            {busy === "confirming"
              ? "Confirming your order…"
              : busy === "starting"
                ? "Preparing payment…"
                : busy === "gateway"
                  ? "Payment window open…"
                  : pendingPayment
                    ? "Retry confirmation"
                    : token
                      ? "Continue to Payment"
                      : "Sign in to continue"}
            <ArrowRightIcon />
          </button>
          <p className="checkout-terms">
            By completing your purchase, you agree to our{" "}
            <span>Terms of Service</span>
          </p>
        </section>
      </main>
    </div>
  );
}
