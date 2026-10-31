import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";

export default function ProductSuggestions({ productSlug }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, backendUrl } = useAppContext();
  const { getProductSuggestions } = useProductService();
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
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductSuggestions(productSlug, token)
      .then((products) => {
        if (active)
          setSuggestions(
            Array.isArray(products)
              ? products.filter((product) => product.slug !== productSlug)
              : [],
          );
      })
      .catch(() => {
        if (active) setSuggestions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productSlug, token]);
  if (!loading && !suggestions.length) return null;
  return (
    <section
      className="pdp-recommendations"
      aria-labelledby="pdp-recommendation-title"
    >
      <header>
        <h2 id="pdp-recommendation-title">You might also like</h2>
        <Link to="/products">
          View all <ChevronRightIcon />
        </Link>
      </header>
      <div className="pdp-recommendation-rail">
        {loading
          ? [0, 1, 2].map((index) => (
              <div className="pdp-recommendation-skeleton" key={index} />
            ))
          : suggestions.map((product) => (
              <Link
                className="pdp-recommendation"
                key={product._id || product.slug}
                to={`/product/${product.slug}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <img
                  src={imageUrl(
                    product.variants?.[0]?.images?.[0] || product.featuredImg,
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
                  ₹{" "}
                  {Number(product.finalPrice ?? product.price).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
