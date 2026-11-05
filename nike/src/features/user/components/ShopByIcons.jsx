import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../../../css/shopByIcons.css";
import { ArrowIconLeft, ArrowIconRight } from "../../../shared/ui/Icons";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";

const ShopByIcons = () => {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const service = useProductService();
  const latest = useRef(service);
  latest.current = service;
  const [error, setError] = useState("");
  const { backendUrl } = useAppContext();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const models = new Map();
    const fallback = "/assets/editorial/image-unavailable.svg";
    const validModel = (model) =>
      typeof model === "string" && model.trim().length > 0;
    const imageUrl = (path) => {
      if (typeof path !== "string" || !path.trim()) return fallback;
      if (/^https?:\/\//i.test(path)) return path;
      const normalized = path.replace(/\\/g, "/");
      // Public campaign assets live on the storefront, not the API host.
      if (/^\/?assets\//.test(normalized))
        return `/${normalized.replace(/^\/+/, "")}`;
      const relative = normalized.includes("uploads/")
        ? normalized.slice(normalized.indexOf("uploads/"))
        : normalized.replace(/^\/+/, "");
      return `${(backendUrl || "").replace(/\/$/, "")}/${relative}`;
    };
    const publish = () => {
      if (!active) return;
      const list = [...models.values()];
      setProducts(list);
      if (list.length) setLoading(false);
    };
    const load = async () => {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        (async () => {
          const options = await latest.current.fetchFilterOptions();
          if (!Array.isArray(options?.models))
            throw new Error("Model options unavailable");
          options.models.forEach((model) => {
            if (validModel(model) && !models.has(model))
              models.set(model, { model, image: fallback });
          });
          publish();
        })(),
        (async () => {
          let page = 1;
          let totalPages = 1;
          do {
            const response = await latest.current.fetchProducts(
              { page, limit: 100 },
              { signal: controller.signal, throwOnError: true },
            );
            if (!active) return;
            if (!Array.isArray(response?.products))
              throw new Error("Product images unavailable");
            response.products.forEach((product) => {
              if (!validModel(product.model)) return;
              const existing = models.get(product.model);
              const rawImage = product.variants
                ?.flatMap((variant) => variant.images || [])
                .find((path) => typeof path === "string" && path.trim());
              if (!existing || (existing.image === fallback && rawImage))
                models.set(product.model, {
                  model: product.model,
                  image: rawImage ? imageUrl(rawImage) : fallback,
                });
            });
            publish();
            totalPages = Math.max(
              1,
              Number(response.pagination?.totalPages) || 1,
            );
            page += 1;
          } while (active && page <= totalPages);
        })(),
      ]);
      if (!active) return;
      setLoading(false);
      if (results.every((result) => result.status === "rejected"))
        setError("We couldn’t load model collections. Please try again.");
      else if (results[1].status === "rejected" && models.size)
        setError(
          "Collections are available, but some images couldn’t load. You can still browse each model.",
        );
    };
    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [backendUrl, attempt]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const ShopByIconsSkeletonItem = () => (
    <div className="store-icon-card animate-pulse">
      <div className="store-icon-image bg-gray-200" />
      <div className="h-4 w-3/4 bg-gray-200 mx-auto rounded" />
    </div>
  );

  return (
    <div className="store-icons-section">
      <div className="store-section-heading">
        <h2 className="store-icons-heading">Icons for a reason.</h2>
        <div className="store-icons-controls">
          <button
            onClick={() => scroll("left")}
            className="store-control-btn"
            aria-label="Scroll left"
          >
            <ArrowIconLeft />
          </button>
          <button
            onClick={() => scroll("right")}
            className="store-control-btn"
            aria-label="Scroll right"
          >
            <ArrowIconRight />
          </button>
        </div>
      </div>

      {!loading && (error || products.length === 0) && (
        <div className="store-inline-error" role={error ? "status" : undefined}>
          <p>{error || "No model collections are available yet."}</p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            {error ? "Retry collections ↗" : "Refresh collections ↗"}
          </button>
        </div>
      )}
      <div className="relative flex min-w-0">
        <div
          ref={scrollRef}
          className="store-icon-rail scroll-smooth custom-scrollbar"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <ShopByIconsSkeletonItem key={idx} />
              ))
            : products.map((product) => (
                <Link
                  key={product.model}
                  to={`/products?${new URLSearchParams({ model: product.model })}`}
                  className="store-icon-card"
                >
                  <img
                    src={product.image}
                    alt={product.model}
                    className="store-icon-image"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "/assets/editorial/image-unavailable.svg";
                    }}
                    loading="lazy"
                  />
                  <h3 className="font-extrabold text-md">
                    {product.model.toUpperCase()}
                  </h3>
                </Link>
              ))}
        </div>
      </div>
    </div>
  );
};

export default ShopByIcons;
