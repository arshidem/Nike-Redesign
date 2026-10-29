import React, { useEffect, useState } from "react";
import { Link } from "../../../lib/navigation";
import axios from "axios";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { useAppContext } from "../../../context/AppContext";

export default function Featured() {
  const { backendUrl } = useAppContext();
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: false,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ products: [], loading: true, error: false });
    axios
      .get(`${backendUrl}/api/products/featured`, { signal: controller.signal })
      .then((response) => {
        const products = Array.isArray(response.data)
          ? response.data
          : response.data.products;
        if (!Array.isArray(products))
          throw new Error("Unexpected product response");
        setState({
          products: products.slice(0, 4),
          loading: false,
          error: false,
        });
      })
      .catch((error) => {
        if (!axios.isCancel(error))
          setState({ products: [], loading: false, error: true });
      });
    return () => controller.abort();
  }, [backendUrl, attempt]);
  const imageUrl = (path) => {
    if (!path) return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.replace(/\\/g, "/");
    const relative = normalized.includes("uploads/")
      ? normalized.slice(normalized.indexOf("uploads/"))
      : normalized.replace(/^\/+/, "");
    return `${(backendUrl || "").replace(/\/$/, "")}/${relative}`;
  };
  return (
    <section className="store-section" aria-labelledby="featured-title">
      <div className="store-section-heading">
        <div>
          <p className="store-eyebrow">IN THE ROTATION</p>
          <h2 id="featured-title">Your next obsession.</h2>
        </div>
        <Link
          className="store-text-link"
          to="/new/best-sellers?bestSellers=true"
        >
          Explore the edit <ArrowUpRightIcon />
        </Link>
      </div>
      {state.loading ? (
        <div
          className="store-product-grid"
          role="status"
          aria-label="Loading featured products"
        >
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="store-product-skeleton" />
          ))}
        </div>
      ) : state.error ? (
        <div className="store-inline-error" role="alert">
          <p>We couldn't load the featured collection. Please try again.</p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            Try again ↗
          </button>
        </div>
      ) : state.products.length === 0 ? (
        <div className="store-inline-error">
          <p>The next featured edit is on its way.</p>
          <Link className="store-text-link" to="/new/arrivals?newArrival=true">
            Browse new arrivals ↗
          </Link>
        </div>
      ) : (
        <div className="store-product-grid">
          {state.products.map((product) => (
            <Link
              key={product._id || product.slug}
              className="store-product"
              to={`/product/${product.slug}`}
            >
              <img
                className="store-card-image"
                src={imageUrl(
                  product.featuredImg || product.variants?.[0]?.images?.[0],
                )}
                alt={product.name}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/assets/editorial/image-unavailable.svg";
                }}
              />
              <h3>{product.name}</h3>
              <p>
                {product.gender
                  ? `${product.gender.charAt(0).toUpperCase()}${product.gender.slice(1)}`
                  : "Footwear & apparel"}
              </p>
              {Number.isFinite(Number(product.finalPrice ?? product.price)) &&
                (product.finalPrice ?? product.price) != null && (
                  <strong>
                    ₹
                    {Number(product.finalPrice ?? product.price).toLocaleString(
                      "en-IN",
                    )}
                  </strong>
                )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
