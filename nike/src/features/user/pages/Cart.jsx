import AppBar from "../../../shared/ui/AppBar";
import WishlistSpinner from "../../../shared/ui/WishlistSpinner";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShoppingBagIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  HeartIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import useCartServices from "../services/cartServices";
import { useAppContext } from "../../../context/AppContext";
import { useProductService } from "../../product/services/productService";
import { useWishlist } from "../../../hooks/useWishlist";
import Footer from "../components/Footer";
import { CartSkeleton } from "../../../shared/ui/Skeleton";
import "../../../css/bag.css";

const money = (value) => `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
const productId = (item) =>
  typeof item.productId === "object" ? item.productId?._id : item.productId;
const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "";

export default function Cart() {
  const { getCart, updateItemQuantity, removeItemFromCart } = useCartServices();
  const { fetchProducts } = useProductService();
  const { backendUrl, token, user } = useAppContext();
  const { wishlistLoading, isInWishlist, handleWishlistToggle } =
    useWishlist(user);
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const mutationInFlight = useRef(false);
  const [deliveryInfo, setDeliveryInfo] = useState(false);
  const [recommendations, setRecommendations] = useState({
    products: [],
    loading: true,
  });

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
  const imageFallback = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/assets/editorial/image-unavailable.svg";
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    getCart()
      .then((data) => {
        if (!Array.isArray(data?.items))
          throw new Error("Unexpected bag response");
        if (active) setCart(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backendUrl, token, retry]);

  useEffect(() => {
    let active = true;
    setRecommendations({ products: [], loading: true });
    fetchProducts({ limit: 12 }, { throwOnError: true })
      .then((result) => {
        if (active)
          setRecommendations({
            products: result.products.slice(0, 6),
            loading: false,
          });
      })
      .catch(() => {
        if (active) setRecommendations({ products: [], loading: false });
      });
    return () => {
      active = false;
    };
  }, [backendUrl, retry]);

  const mutate = async (id, operation) => {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBusyId(id);
    try {
      const response = await operation();
      const updated = response?.cart ?? response;
      if (!Array.isArray(updated?.items))
        throw new Error("We couldn’t update your bag. Please try again.");
      setCart(updated);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error.message ||
          "We couldn’t update your bag. Please try again.",
      );
    } finally {
      mutationInFlight.current = false;
      setBusyId(null);
    }
  };

  const items = cart?.items || [];
  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const subtotal = Number(
    cart?.subtotal ??
      items.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      ),
  );
  const shippingKnown =
    cart?.shippingFee != null && Number.isFinite(Number(cart.shippingFee));
  const shipping = shippingKnown ? Number(cart.shippingFee) : 0;
  const tax = Number(cart?.tax || 0);
  const discount = cart?.coupon?.applied
    ? Number(cart.coupon.discountAmount || 0)
    : 0;
  const total = Number(
    cart?.finalTotal ??
      (shippingKnown
        ? (cart?.total ?? subtotal + shipping + tax - discount)
        : subtotal + tax - discount),
  );
  const hasUnavailable = items.some(
    (item) => item.stockAvailable === false || item.stock === 0 || (item.stock != null && item.quantity > item.stock),
  );
  const productRoute = (item) => {
    const match = recommendations.products.find(
      (product) => product._id === productId(item),
    );
    const slug = item.slug || item.productId?.slug || match?.slug;
    return slug
      ? `/product/${slug}`
      : `/products?search=${encodeURIComponent(item.name || "")}`;
  };

  return (
    <div className="bag-page">
      <Toaster position="top-center" />
      <AppBar className="bag-header" fallback="/products" hideBag hideSearch />
      <main className="bag-main" id="main-content">
        <div className="bag-heading">
          <h1>
            Your Bag <span>({loading ? "…" : itemCount})</span>
          </h1>
          <p>One step closer to your next move.</p>
        </div>
        {loading ? (
          <div
            className="bag-loading"
            role="status"
            aria-label="Loading your bag"
          >
            <CartSkeleton />
          </div>
        ) : loadError ? (
          <section className="bag-empty" role="alert">
            <ShoppingBagIcon />
            <h2>We couldn’t load your bag.</h2>
            <p>Your items haven’t been changed. Please try again.</p>
            <button
              className="store-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again <ArrowRightIcon />
            </button>
          </section>
        ) : !items.length ? (
          <section className="bag-empty">
            <ShoppingBagIcon />
            <h2>A little room for your next favourite.</h2>
            <p>Your bag is empty. Find the pair that moves you.</p>
            <Link className="store-button" to="/products">
              Explore the collection <ArrowRightIcon />
            </Link>
          </section>
        ) : (
          <div className="bag-layout">
            <section className="bag-items-panel" aria-label="Items in your bag">
              <ul className="bag-items">
                {items.map((item) => {
                  const id =
                    token && item._id
                      ? item._id
                      : `${productId(item)}${item.variantId}${item.size}`;
                  const saved = isInWishlist(productId(item));
                  const stockKnown =
                    item.stock != null && Number.isFinite(Number(item.stock));
                  const unavailable =
                    item.stockAvailable === false || item.stock === 0;
                  return (
                    <li className="bag-item" key={id} aria-busy={busyId === id}>
                      <Link className="bag-item-media" to={productRoute(item)}>
                        <img
                          src={imageUrl(item.image)}
                          alt={item.name}
                          width="936"
                          height="1170"
                          onError={imageFallback}
                        />
                      </Link>
                      <div className="bag-item-copy">
                        <Link className="bag-item-name" to={productRoute(item)}>
                          {item.name}
                        </Link>
                        <p className="bag-item-gender">
                          {capitalize(item.gender) || "Everyday essentials"}
                        </p>
                        <p className="bag-item-variant">
                          {capitalize(item.color)} <span>|</span> Size{" "}
                          <span className="bag-item-size">{item.size}</span>
                        </p>
                        <p className="bag-item-price">
                          {money(
                            item.total ??
                              Number(item.price || 0) * item.quantity,
                          )}
                        </p>
                        {stockKnown && item.quantity > item.stock && item.stock > 0 && <p className="bag-stock-warning">Only {item.stock} available. Reduce quantity to continue.</p>}
                        {unavailable && (
                          <p className="bag-stock-warning">
                            Currently unavailable. Please remove this item.
                          </p>
                        )}
                        {!unavailable && stockKnown && item.stock <= 3 && (
                          <p className="bag-stock-note">
                            Only {item.stock} left
                          </p>
                        )}
                        <div className="bag-item-controls">
                          <button
                            className="bag-remove"
                            aria-label={`Remove ${item.name} from bag`}
                            disabled={busyId !== null}
                            onClick={() =>
                              mutate(id, () => removeItemFromCart(id))
                            }
                          >
                            <TrashIcon />
                          </button>
                          <div
                            className="bag-quantity"
                            role="group"
                            aria-label={`Quantity for ${item.name}`}
                          >
                            <button
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={
                                busyId !== null ||
                                item.quantity <= 1
                              }
                              onClick={() =>
                                mutate(id, () =>
                                  updateItemQuantity(id, item.quantity - 1),
                                )
                              }
                            >
                              <MinusIcon />
                            </button>
                            <span aria-live="polite">{item.quantity}</span>
                            <button
                              aria-label={`Increase quantity of ${item.name}`}
                              disabled={
                                busyId !== null ||
                                unavailable ||
                                (stockKnown &&
                                  item.quantity >= Number(item.stock))
                              }
                              onClick={() =>
                                mutate(id, () =>
                                  updateItemQuantity(id, item.quantity + 1),
                                )
                              }
                            >
                              <PlusIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        className={`bag-favorite ${saved ? "is-saved" : ""}`}
                        aria-label={`${saved ? "Remove from" : "Add to"} wishlist: ${item.name}`}
                        aria-pressed={saved}
                        disabled={wishlistLoading[productId(item)]}
                        aria-busy={Boolean(wishlistLoading[productId(item)])}
                        onClick={(event) =>
                          handleWishlistToggle(productId(item), event)
                        }
                      >
                        {wishlistLoading[productId(item)] ? <WishlistSpinner /> : <HeartIcon />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="bag-service-strip">
                <div>
                  <TruckIcon />
                  <p>
                    <strong>Delivery Options</strong>
                    <small>Confirmed at checkout</small>
                  </p>
                </div>
                <div>
                  <ArchiveBoxIcon />
                  <p>
                    <strong>Easy Returns</strong>
                    <small>30-day returns</small>
                  </p>
                </div>
                <div>
                  <ShieldCheckIcon />
                  <p>
                    <strong>Secure Checkout</strong>
                    <small>Shop with confidence</small>
                  </p>
                </div>
              </div>
            </section>
            <aside className="bag-summary" aria-labelledby="bag-summary-title">
              <h2 id="bag-summary-title">Order Summary</h2>
              <dl>
                <div>
                  <dt>
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div className="bag-delivery-row">
                  <dt>
                    Estimated Delivery &amp; Handling{" "}
                    <button
                      aria-label="About delivery charges"
                      aria-expanded={deliveryInfo}
                      aria-controls="bag-delivery-note"
                      onClick={() => setDeliveryInfo((value) => !value)}
                    >
                      <InformationCircleIcon />
                    </button>
                  </dt>
                  <dd>{shippingKnown ? money(shipping) : "At checkout"}</dd>
                </div>
                {deliveryInfo && (
                  <div className="bag-delivery-note" id="bag-delivery-note">
                    <dt className="sr-only">Delivery information</dt>
                    <dd>
                      Delivery charges are estimated here and confirmed during
                      checkout.
                    </dd>
                  </div>
                )}
                {tax > 0 && (
                  <div>
                    <dt>Tax</dt>
                    <dd>{money(tax)}</dd>
                  </div>
                )}
                {discount > 0 && (
                  <div className="bag-discount">
                    <dt>
                      Discount
                      {cart.coupon?.code ? ` (${cart.coupon.code})` : ""}
                    </dt>
                    <dd>− {money(discount)}</dd>
                  </div>
                )}
                <div className="bag-summary-total">
                  <dt>{shippingKnown ? "Total" : "Estimated total"}</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              {!shippingKnown && (
                <p className="bag-summary-note">
                  Delivery charges will be added at checkout.
                </p>
              )}
              {hasUnavailable && (
                <p className="bag-stock-warning">
                  Reduce quantities or remove unavailable items to continue.
                </p>
              )}
              <button
                className="bag-checkout"
                onClick={() => navigate("/checkout")}
                disabled={busyId !== null || hasUnavailable}
              >
                Go to Checkout <ArrowRightIcon />
              </button>
            </aside>
          </div>
        )}
        {(recommendations.loading || recommendations.products.length > 0) && (
          <section
            className="bag-recommendations"
            aria-labelledby="bag-recommendation-title"
          >
            <header>
              <h2 id="bag-recommendation-title">You might also like</h2>
              <Link to="/products">
                View all <ArrowRightIcon />
              </Link>
            </header>
            <div className="bag-recommendation-rail">
              {recommendations.loading
                ? [0, 1, 2].map((index) => (
                    <div className="bag-recommendation-skeleton" key={index} />
                  ))
                : recommendations.products.map((product) => (
                    <article
                      className="bag-recommendation"
                      key={product._id || product.slug}
                    >
                      <Link to={`/product/${product.slug}`}>
                        <img
                          src={imageUrl(
                            product.variants?.[0]?.images?.[0] ||
                              product.featuredImg,
                          )}
                          alt={product.name}
                          loading="lazy"
                          onError={imageFallback}
                        />
                        <div>
                          <h3>{product.name}</h3>
                          <p>{capitalize(product.gender)}</p>
                          <strong>
                            {money(product.finalPrice ?? product.price)}
                          </strong>
                        </div>
                      </Link>
                      <button
                        className={`bag-recommendation-favorite ${isInWishlist(product._id) ? "is-saved" : ""}`}
                        aria-label={`${isInWishlist(product._id) ? "Remove from" : "Add to"} wishlist: ${product.name}`}
                        aria-pressed={isInWishlist(product._id)}
                        disabled={wishlistLoading[product._id]}
                        aria-busy={Boolean(wishlistLoading[product._id])}
                        onClick={(event) =>
                          handleWishlistToggle(product._id, event)
                        }
                      >
                        {wishlistLoading[product._id] ? <WishlistSpinner /> : <HeartIcon />}
                      </button>
                    </article>
                  ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
