import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import {
  ArrowIconLeft,
  ArrowIconRight,
  XIcon,
  BagIcon,
  MinusIcon,
  PlusIcon,
  HeartIcon,
  Spinner,
} from "../../../shared/ui/Icons";
import Loader from "../../../shared/ui/Loader";
import useCartServices from "../services/cartServices";
import ProductReviewSection from "../components/ProductReviewSection";
import Footer from "../components/Footer";
import { ProductDetailsSkeleton } from "../../../shared/ui/Skeleton";
import ProductSuggestions from "../components/ProductSuggestions";
import { useWishlistService } from "../services/wishlistServices";

const AccordionItem = ({ title, children, isOpen, onClick }) => (
  <div className="border-t">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center py-4 font-semibold text-left"
      aria-expanded={isOpen}
    >
      {title}
      <ArrowIconRight
        className={`w-5 h-5 transition-transform duration-200 ${
          isOpen ? "rotate-90" : ""
        }`}
      />
    </button>
    {isOpen && <div className="pb-4 text-sm text-gray-700">{children}</div>}
  </div>
);

const ProductDetails = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [cartItem, setCartItem] = useState(null);
  const [cartMap, setCartMap] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setIsWishlistLoading] = useState(false);

  const { toggleWishlist, getWishlist } = useWishlistService();

  const { fetchProductBySlug } = useProductService();
  const { backendUrl, token } = useAppContext();
  const { addToCart, updateItemQuantity, removeItemFromCart, getCart } =
    useCartServices();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(
      /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
    );
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };
  const isInWishlist = wishlistIds.includes(product?._id);

  // Fetch wishlist on component mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await getWishlist();
        const wishlistProductIds = response.data.map((item) => item._id);
        setWishlistIds(wishlistProductIds);
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
      }
    };

    if (token) fetchWishlist();
  }, [token]);

  // Handle wishlist toggle
const handleWishlistToggle = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!token) {
    // Custom toast for not logged in users
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="p-4 flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-900">
              Please login to add items to your wishlist
            </span>
            <button
              onClick={() => {
                toast.dismiss(t.id); // close toast manually
                navigate("/signin"); // redirect
              }}
              className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
            >
              Sign In
            </button>
          </div>
        </div>
      ),
      {
        duration: 3000, // 3 seconds
      }
    );
    return; // Stop execution if user not logged in
  }

  try {
    setIsWishlistLoading(true);
    const response = await toggleWishlist(product._id);
    setWishlistIds(response.wishlist.map((item) => item._id));

    toast.success(
      response.action === "added"
        ? "Added to wishlist!"
        : "Removed from wishlist!"
    );
  } catch (err) {
    toast.error(err.message || "Failed to update wishlist");
  } finally {
    setIsWishlistLoading(false);
  }
};

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductBySlug(productSlug);
        if (!data) return navigate("/not-found", { replace: true });
        setProduct(data);
        setSelectedImage(formatImageUrl(data.variants?.[0]?.images?.[0]));
      } catch {
        toast.error("Failed to load product");
        navigate("/products", { replace: true });
      }
    };

    const loadCart = async () => {
      const cart = await getCart();
      const map = {};
      cart.items.forEach((item) => {
        map[`${item.productId}-${item.variantId}-${item.size}`] = item;
      });
      setCartMap(map);
    };

    loadProduct();
    loadCart();
  }, [productSlug]);

  useEffect(() => {
    if (!product || !selectedSize) return;

    const variant = product.variants[selectedVariantIndex];
    const key = `${product._id}-${variant._id}-${selectedSize}`;
    setCartItem(cartMap[key] || null);
  }, [selectedSize, selectedVariantIndex, product, cartMap]);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleVariantChange = (index) => {
    const variant = product.variants[index];
    setSelectedVariantIndex(index);
    setSelectedSize(null);
    setCartItem(null);
    setSelectedImage(formatImageUrl(variant?.images?.[0]));
  };

  const handleAddToBag = async () => {
    const variant = product.variants[selectedVariantIndex];
    const selectedSizeObj = variant.sizes.find((s) => s.size === selectedSize);
    const imageUrl = formatImageUrl(variant.images?.[0]);

    try {
      setIsProcessing(true);
      const cart = await addToCart({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        image: imageUrl,
        color: variant.color,
        size: selectedSize,
        price: product.finalPrice,
        quantity: 1,
        stock: selectedSizeObj.stock,
        gender: product.gender,
      });

      const item = cart.items.find(
        (i) =>
          i.productId === product._id &&
          i.variantId === variant._id &&
          i.size === selectedSize
      );

      if (item) {
        const key = `${product._id}-${variant._id}-${selectedSize}`;
        setCartMap((prev) => ({ ...prev, [key]: item }));
        setCartItem(item);

        toast.success(
          <div className="flex items-center gap-2">
            <img src={imageUrl} className="w-10 h-10 object-cover rounded" />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm">Size: {selectedSize}</p>
            </div>
          </div>
        );
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleQuantityChange = async (delta) => {
    if (!cartItem || isProcessing) return;

    const newQty = cartItem.quantity + delta;
    const isGuest = !token;

    // For guests: use composite key; for logged-in: use item._id
    const itemId = isGuest
      ? cartItem.productId + cartItem.variantId + cartItem.size
      : cartItem._id;

    try {
      setIsProcessing(true);

      if (newQty < 1) {
        const updatedCart = await removeItemFromCart(itemId);
        const key = `${cartItem.productId}-${cartItem.variantId}-${cartItem.size}`;
        setCartMap((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
        setCartItem(null);
      } else {
        const updatedCart = await updateItemQuantity(itemId, newQty);
        const key = `${cartItem.productId}-${cartItem.variantId}-${cartItem.size}`;

        const updatedItem = updatedCart.items.find((item) => {
          return isGuest
            ? item.productId + item.variantId + item.size === itemId
            : item._id === cartItem._id;
        });

        if (updatedItem) {
          setCartMap((prev) => ({ ...prev, [key]: updatedItem }));
          setCartItem(updatedItem);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to update quantity");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!product) return <ProductDetailsSkeleton />;

  const variant = product.variants[selectedVariantIndex];
  const thumbnails = variant.images?.map(formatImageUrl) || [];
  const sizes = variant.sizes || [];
  const selectedSizeStock =
    sizes.find((s) => s.size === selectedSize)?.stock || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />

      <div className="fixed top-0 left-0 w-full z-30 bg-white shadow-md px-4 py-2 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-2 border border-black rounded hover:bg-gray-100 transition sm:w-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4  rotate-180"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5L15.75 12 8.25 19.5"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-10">
        {/* Image Section */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-24 lg:h-fit self-start">
          <img
            src={selectedImage}
            className="w-full aspect-square object-cover rounded"
          />
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {thumbnails.map((thumb, idx) => (
              <img
                key={idx}
                src={thumb}
                className={`w-20 h-20 border rounded object-cover cursor-pointer ${
                  selectedImage === thumb ? "border-black" : "border-gray-200"
                }`}
                onClick={() => setSelectedImage(thumb)}
              />
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Available Colors</h4>
            <div className="flex gap-2">
              {product.variants.map((v, index) => (
                <button
                  key={index}
                  onClick={() => handleVariantChange(index)}
                  className={`w-12 h-12 border-2 rounded ${
                    selectedVariantIndex === index
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={formatImageUrl(v.images?.[0])}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="lg:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="text-xl font-semibold">₹{product.finalPrice}</div>
          {product.discountPercentage > 0 && (
            <div className="text-sm text-red-500">
              <span className="line-through text-gray-400">
                ₹{product.price}
              </span>{" "}
              ({product.discountPercentage}% OFF)
            </div>
          )}

          {/* Sizes */}
          <div>
            <h4 className="font-semibold">Select Size</h4>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {sizes.map(({ size, stock }, i) => (
                <button
                  key={i}
                  onClick={() => handleSizeSelect(size)}
                  disabled={stock === 0}
                  className={`p-2 border rounded ${
                    selectedSize === size
                      ? "bg-black text-white"
                      : "hover:border-black"
                  } ${
                    stock === 0
                      ? "text-gray-400 line-through cursor-not-allowed"
                      : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Buttons */}
          {/* Cart Buttons */}
          <div className="mt-6 flex gap-3">
           

            {/* Add to Cart Button */}
            {!cartItem ? (
              <button
                onClick={handleAddToBag}
                disabled={
                  !selectedSize || isProcessing || selectedSizeStock === 0
                }
                className="flex-1 py-3 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              >
                {isProcessing ? "Adding..." : "Add to Bag"}
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-between border border-black px-4 py-2 rounded-full">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isProcessing}
                >
                  {cartItem.quantity === 1 ? <XIcon /> : <MinusIcon />}
                </button>
                <span>{cartItem.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={
                    isProcessing || cartItem.quantity >= selectedSizeStock
                  }
                >
                  <PlusIcon />
                </button>
              </div>
            )}
             {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`flex items-center justify-center p-3 rounded-full border ${
                isInWishlist
                  ? "border hover:bg-gray-200"
                  : " border hover:bg-gray-200"
              }`}
              aria-label={
                isInWishlist ? "Remove from wishlist" : "Add to wishlist"
              }
            >
              {wishlistLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
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
                  className={`h-6 w-6 ${
                    isInWishlist
                      ? "fill-red-600 stroke-none" // Fixed typo: strock-none → stroke-none
                      : "fill-none stroke-black"
                  }`}
                  color={isInWishlist ? "red" : "none"} // Optional: can remove if using className
                  stroke={isInWishlist ? "none" : "black"} // Optional: can remove if using className
                />
              )}
            </button>
          </div>

          {/* Accordion Section */}
          <div className="pt-4 border-t">
            {/* Product Description outside Accordion */}
            {product.description && (
              <div className="mb-4 text-sm text-gray-700 whitespace-pre-wrap">
                {showFullDesc ? (
                  <>
                    <p>{product.description}</p>
                    <button
                      onClick={() => setShowFullDesc(false)}
                      className="text-blue-500 text-xs mt-1"
                    >
                      Show less
                    </button>
                  </>
                ) : (
                  <>
                    <p className="line-clamp-2">{product.description}</p>
                    <button
                      onClick={() => setShowFullDesc(true)}
                      className="text-blue-500 text-xs mt-1"
                    >
                      More...
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Accordion Section */}
            <AccordionItem
              title="Product Details"
              isOpen={openAccordion === 0}
              onClick={() => setOpenAccordion(openAccordion === 0 ? null : 0)}
            >
              {product.productDetails && (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {product.productDetails}
                </pre>
              )}
            </AccordionItem>

            <AccordionItem
              title="Delivery & Returns"
              isOpen={openAccordion === 2}
              onClick={() => setOpenAccordion(openAccordion === 2 ? null : 2)}
            >
              <p>Free delivery on orders above ₹1000. Easy 30-day returns.</p>
            </AccordionItem>
            {product.videoUrl && (
              <div className="aspect-w-16 aspect-h-9 mt-4">
                <h1 className="text-xl font-semibold mb-4 text-gray-800 tracking-tight">
                  Visual Preview
                </h1>
                <iframe
                  src={product.videoUrl}
                  className="w-full h-64"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${product.name} video`}
                />
              </div>
            )}
            <ProductReviewSection productId={product._id} />
          </div>
        </div>
      </div>
      <ProductSuggestions productSlug={product.slug} />
      <Footer />
    </div>
  );
};

export default ProductDetails;
