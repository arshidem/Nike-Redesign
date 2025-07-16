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
  const { fetchProducts } = useProductService();
  const { backendUrl } = useAppContext();

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const { products: productList } = await fetchProducts({ category: "shoes" });
        const uniqueModels = new Map();

        productList.forEach((product) => {
          if (!uniqueModels.has(product.model)) {
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
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const ShopByIconsSkeletonItem = () => (
    <div className="min-w-[150px] flex-shrink-0 rounded-xl text-center animate-pulse">
      <div className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] bg-gray-200 rounded-xl mb-3" />
      <div className="h-4 w-3/4 bg-gray-200 mx-auto rounded" />
    </div>
  );

  return (
    <div className="relative py-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Shop by Icons</h2>
        <div className="hidden md:flex md:gap-5">
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

      <div className="relative flex mt-4">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-6 scroll-smooth custom-scrollbar"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <ShopByIconsSkeletonItem key={idx} />
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  to={`/model/${encodeURIComponent(product.model)}`}
                  className="min-w-[150px] flex-shrink-0 bg-white rounded-xl text-center shadow block hover:shadow-lg transition"
                >
                  <img
                    src={product.image}
                    alt={product.model}
                    className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] object-cover mb-3"
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
