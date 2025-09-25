import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import { useWishlistService } from "../services/wishlistServices";
import { BackBar, HeartIcon, BagIcon } from "../../../shared/ui/Icons";
import Footer from "../components/Footer";
import { ModelSkeleton } from "../../../shared/ui/Skeleton";
import { toast } from "react-hot-toast";
import useCartServices from "../services/cartServices";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [cartLoading, setCartLoading] = useState({});
  const navigate = useNavigate();
  const { user, backendUrl } = useAppContext();
  const { toggleWishlist, getWishlist } = useWishlistService();
  const { addToCart } = useCartServices();

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };
   const fetchWishlist = async () => {
      if (!user) {
        navigate("/signin");
        return;
      }

      try {
        setLoading(true);
        const response = await getWishlist();
        setWishlistItems(response.data);
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
        toast.error("Failed to load your wishlist");
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
 fetchWishlist();
  }, []);

  const handleWishlistToggle = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setWishlistLoading((prev) => ({ ...prev, [productId]: true }));
      const response = await toggleWishlist(productId);
      setWishlistItems(response.wishlist);
      toast.success(
        response.action === "added"
          ? "Added to wishlist!"
          : "Removed from wishlist!"
      );
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.slug}`);
    toast("Please select a size on the product page");
  };

  if (loading) return <ModelSkeleton />;

  return (
    <div className="p-6">
      <BackBar />

      <h1 className="text-xl font-bold mb-2 mt-10">
        Your Wishlist ({wishlistItems.length})
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link
            to="/home"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {wishlistItems.map((product) => {
            const productImage =
              product.mainImage ||
              product.images?.[0] ||
              product.variants?.[0]?.images?.[0] ||
              "/placeholder.jpg";
            const isWishlistLoading = wishlistLoading[product._id];
            const isCartLoading = cartLoading[product._id];
            const showDiscount = product.discountPercentage > 0;
            const displayPrice = product.finalPrice || product.price;

            return (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition block p-4 relative"
              >
                {/* Product image with error handling */}
                <Link to={`/product/${product.slug}`}>
                  <img
                    src={formatImageUrl(productImage)}
                    alt={product.name}
                    className="w-full aspect-square object-cover mb-3"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                </Link>

                <div className="space-y-1">
                  <Link to={`/product/${product.slug}`}>
                    <h2 className="text-sm font-semibold line-clamp-1 hover:underline">
                      {product.name}
                    </h2>
                  </Link>
                  <p className="text-gray-500 text-xs capitalize">
                    {product.gender}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-gray-700 font-medium">
                        ₹{displayPrice?.toLocaleString()}
                      </p>
                      {showDiscount && (
                        <p className="text-xs text-gray-400 line-through">
                          ₹{product.price?.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {showDiscount && (
                      <span className="text-xs text-red-500">
                        {product.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to cart button */}
                <div className="flex mt-3 justify-between w-full gap-2">
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={isCartLoading}
                    className="w-full  py-2 bg-black text-white text-xs rounded-full flex items-center justify-center gap-1 hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isCartLoading ? (
                      "Adding..."
                    ) : (
                      <>
                        <BagIcon className="w-3 h-3" />
                        <span>Add to Bag</span>
                      </>
                    )}
                  </button>
                  {/* Wishlist button */}
                  <button
                    onClick={(e) => handleWishlistToggle(product._id, e)}
                    className={` p-2 rounded-full shadow bg-white`}
                    aria-label="Remove from wishlist"
                    disabled={isWishlistLoading}
                  >
                    {isWishlistLoading ? (
                      <svg
                        className="animate-spin h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <HeartIcon
                        className="h-4 w-4 fill-red-600 stroke-none"
                        fill="red"
                        stroke="red"
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Wishlist;
