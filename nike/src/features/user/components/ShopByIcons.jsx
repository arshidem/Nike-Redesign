import { mediaUrl } from "../../../utils/mediaUrl";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "../../../lib/navigation";
import { ArrowIconLeft, ArrowIconRight } from "../../../shared/ui/Icons";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";

const ShopByIcons = () => {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { fetchProducts } = useProductService();
  const { backendUrl } = useAppContext();

  const formatImageUrl = mediaUrl;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { products: productList } = await fetchProducts({
          category: "shoes",
        });
        const uniqueModels = new Map();

        productList.forEach((product) => {
          if (product.model && !uniqueModels.has(product.model)) {
            const rawImage = product?.variants?.[0]?.images?.[0];
            const image = formatImageUrl(rawImage);
            uniqueModels.set(product.model, {
              id: product._id,
              model: product.model,
              image,
            });
          }
        });

        setProducts(Array.from(uniqueModels.values()));
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [attempt]);

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
            className="z-10 bg-white rounded-full shadow-md p-3.5 hover:bg-gray-100 transition"
            aria-label="Scroll left"
          >
            <ArrowIconLeft />
          </button>
          <button
            onClick={() => scroll("right")}
            className="z-10 bg-white rounded-full shadow-md p-3.5 hover:bg-gray-100 transition"
            aria-label="Scroll right"
          >
            <ArrowIconRight />
          </button>
        </div>
      </div>

      {!loading && products.length === 0 && (
        <div className="store-inline-error">
          <p>No collections to show right now. Please try again shortly.</p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            Refresh collections ↗
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
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }

                  key={product.id}
                  to={`/model/${encodeURIComponent(product.model)}`}
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
