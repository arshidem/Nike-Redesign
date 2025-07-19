import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ProductSuggestions = ({ productSlug }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token,backendUrl } = useAppContext();
const {getProductSuggestions}=useProductService()

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };
  useEffect(() => {
    if (!productSlug) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await getProductSuggestions(productSlug, token);
        setSuggestions(res || []);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [productSlug, token]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold mb-4">You might also like</h2>

      <div className="flex gap-4 overflow-x-auto no-scrollbar">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, idx) => (
                <div
                  key={idx}
                  className="min-w-[180px] max-w-[180px] bg-white rounded-lg p-3 shadow"
                >
                  <Skeleton height={150} />
                  <Skeleton width={100} height={14} className="mt-2" />
                  <Skeleton height={12} width={80} />
                  <Skeleton height={16} width={60} />
                </div>
              ))
          : suggestions.map((product) => {
              const image = product.variants?.[0].images?.[0] || "/placeholder.jpg";
              return (
                <Link
                  to={`/product/${product.slug}`}
                  key={product._id}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}

                  className="min-w-[180px] max-w-[180px] bg-white rounded-lg shadow hover:shadow-lg transition block p-3 flex-shrink-0"
                >
                  <img
                    src={formatImageUrl(image)}
                    alt={product.name || "Suggested Product"}
                    className="w-full h-[150px] object-cover mb-2"
                    loading="lazy"
                  />
                  {product.tag && (
                    <span className="text-red-600 font-semibold text-xs">{product.tag}</span>
                  )}
                  <h3 className="text-sm font-semibold line-clamp-2">{product.name}</h3>
                  <p className="text-gray-500 text-xs capitalize">{product.gender}</p>
                  <p className="text-gray-700 font-medium mt-1 text-sm">
                    MRP: ₹{product.price?.toLocaleString()}
                  </p>
                </Link>
              );
            })}
      </div>
    </div>
  );
};

export default ProductSuggestions;
