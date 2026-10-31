import WishlistSpinner from "../../../shared/ui/WishlistSpinner";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useProductService } from "../../product/services/productService";
import { useAppContext } from "../../../context/AppContext";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  TruckIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Search from "../components/Search";
import SizeGuide from "../components/SizeGuide";
import "../../../css/product-details.css";
import useCartServices from "../services/cartServices";
import ProductReviewSection from "../components/ProductReviewSection";
import Footer from "../components/Footer";
import { ProductDetailsSkeleton } from "../../../shared/ui/Skeleton";
import ProductSuggestions from "../components/ProductSuggestions";
import { useWishlistService } from "../services/wishlistServices";

const AccordionItem = ({
  title,
  icon: Icon,
  children,
  isOpen,
  onClick,
  id,
}) => (
  <section className="pdp-accordion">
    <button onClick={onClick} aria-expanded={isOpen} aria-controls={id}>
      <Icon />
      <span>{title}</span>
      <ChevronRightIcon className={isOpen ? "is-open" : ""} />
    </button>
    {isOpen && (
      <div id={id} className="pdp-accordion-content">
        {children}
      </div>
    )}
  </section>
);

const ProductDetails = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sizeGuideButton = useRef(null);
  const touchStart = useRef(null);
  const closeSizeGuide = useCallback(() => setSizeGuideOpen(false), []);
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
    if (!imagePath || typeof imagePath !== "string")
      return "/assets/editorial/image-unavailable.svg";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const normalized = imagePath.replace(/\\/g, "/");
    const relative = normalized.includes("uploads/")
      ? normalized.slice(normalized.indexOf("uploads/"))
      : normalized.replace(/^\/+/, "");
    return `${(backendUrl || "").replace(/\/$/, "")}/${relative}`;
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
        },
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
          : "Removed from wishlist!",
      );
    } catch (err) {
      toast.error(err.message || "Failed to update wishlist");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setProduct(null);
    setLoadError(false);
    setSelectedVariantIndex(0);
    setSelectedSize(null);
    setCartItem(null);
    setShowFullDesc(false);
    setOpenAccordion(null);
    setSizeGuideOpen(false);
    const loadProduct = async () => {
      try {
        const data = await fetchProductBySlug(productSlug);
        if (!active) return;
        if (!data || !data.variants?.length) {
          setLoadError(true);
          return;
        }
        setProduct(data);
        setSelectedImage(formatImageUrl(data.variants?.[0]?.images?.[0]));
      } catch {
        if (active) setLoadError(true);
      }
    };

    const loadCart = async () => {
      try {
        const cart = await getCart();
        if (!active) return;
        const map = {};
        (cart.items || []).forEach((item) => {
          map[`${item.productId}-${item.variantId}-${item.size}`] = item;
        });
        setCartMap(map);
      } catch {
        if (active) setCartMap({});
      }
    };

    loadProduct();
    loadCart();
    return () => {
      active = false;
    };
  }, [productSlug, retry]);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

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
    if (!selectedSizeObj || selectedSizeObj.stock <= 0) {
      toast.error("Please select an available size");
      return;
    }
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
        price: product.finalPrice ?? product.price,
        quantity: 1,
        stock: selectedSizeObj.stock,
        gender: product.gender,
      });

      const item = cart.items.find(
        (i) =>
          i.productId === product._id &&
          i.variantId === variant._id &&
          i.size === selectedSize,
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
          </div>,
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

  const header = (
    <header className="pdp-header">
      <button
        className="pdp-back"
        onClick={() =>
          window.history.state?.idx > 0 ? navigate(-1) : navigate("/products")
        }
      >
        <ArrowLeftIcon />
        <span>Back</span>
      </button>
      <Link to="/home" aria-label="Nike home" className="pdp-logo">
        <img src="/assets/logo/nikeLogo.png" alt="Nike" />
      </Link>
      <div>
        <button
          aria-label="Search products"
          onClick={() => setSearchOpen(true)}
        >
          <MagnifyingGlassIcon />
        </button>
        <Link to="/bag" aria-label="Shopping bag">
          <ShoppingBagIcon />
        </Link>
      </div>
    </header>
  );
  if (!product)
    return (
      <div className="pdp-page">
        {header}
        {searchOpen && <Search isOpen onClose={() => setSearchOpen(false)} />}
        {loadError ? (
          <main className="pdp-unavailable">
            <p className="store-eyebrow">LET’S FIND YOUR NEXT</p>
            <h1>This product is unavailable.</h1>
            <p>Try again, or explore the rest of the collection.</p>
            <button
              className="store-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again <ArrowRightIcon />
            </button>
            <Link to="/products">Browse all products</Link>
          </main>
        ) : (
          <div className="pdp-loading">
            <ProductDetailsSkeleton />
          </div>
        )}
      </div>
    );

  const variant = product.variants[selectedVariantIndex] || product.variants[0];
  const thumbnails = variant.images?.map(formatImageUrl) || [];
  const currentImageIndex = Math.max(0, thumbnails.indexOf(selectedImage));
  const sizes = variant.sizes || [];
  const selectedSizeStock =
    sizes.find((s) => s.size === selectedSize)?.stock || 0;
  const changeImage = (direction) => {
    if (thumbnails.length)
      setSelectedImage(
        thumbnails[
          (currentImageIndex + direction + thumbnails.length) %
            thumbnails.length
        ],
      );
  };
  const rating = Math.min(5, Math.max(0, Number(product.rating?.average) || 0));
  const reviewCount = product.rating?.total || 0;
  const footwear = product.category === "shoes";
  const genderLabel =
    { men: "Men’s", women: "Women’s", kids: "Kids’", unisex: "Unisex" }[
      product.gender
    ] || "Everyday";
  const price = product.finalPrice ?? product.price;

  return (
    <div className="pdp-page">
      <Toaster position="top-center" />
      {header}
      {searchOpen && <Search isOpen onClose={() => setSearchOpen(false)} />}
      <main className="pdp-main">
        <div className="pdp-layout">
          <section className="pdp-gallery" aria-label="Product images">
            <div
              className="pdp-gallery-stage"
              tabIndex={0}
              aria-label={`Product image ${currentImageIndex + 1} of ${thumbnails.length || 1}`}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  changeImage(event.key === "ArrowLeft" ? -1 : 1);
                }
              }}
              onTouchStart={(event) => {
                touchStart.current = event.changedTouches[0].clientX;
              }}
              onTouchEnd={(event) => {
                if (touchStart.current == null) return;
                const distance =
                  event.changedTouches[0].clientX - touchStart.current;
                if (Math.abs(distance) > 50) changeImage(distance > 0 ? -1 : 1);
                touchStart.current = null;
              }}
            >
              <img
                className="pdp-main-image"
                src={selectedImage || "/assets/editorial/image-unavailable.svg"}
                alt={`${product.name}, ${variant.color}, view ${currentImageIndex + 1}`}
                fetchPriority="high"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    "/assets/editorial/image-unavailable.svg";
                }}
              />
              {thumbnails.length > 1 && (
                <>
                  <button
                    className="pdp-gallery-prev"
                    aria-label="Previous product image"
                    onClick={() => changeImage(-1)}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    className="pdp-gallery-next"
                    aria-label="Next product image"
                    onClick={() => changeImage(1)}
                  >
                    <ChevronRightIcon />
                  </button>
                </>
              )}
              <span className="pdp-image-count" aria-live="polite">
                {currentImageIndex + 1} / {thumbnails.length || 1}
              </span>
            </div>
            <div className="pdp-thumbnails">
              {thumbnails.map((image, index) => (
                <button
                  key={`${image}:${index}`}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={selectedImage === image}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
          <section className="pdp-info" aria-labelledby="product-title">
            <p className="pdp-eyebrow">
              {genderLabel}{" "}
              {footwear
                ? "Shoes"
                : typeof product.category === "string"
                  ? product.category
                  : "Collection"}
            </p>
            <h1 id="product-title">{product.name}</h1>
            <div className="pdp-price">
              <strong>₹ {Number(price).toLocaleString("en-IN")}</strong>
              <span>(incl. of taxes)</span>
              {product.discountPercentage > 0 && (
                <small>
                  <del>₹{Number(product.price).toLocaleString("en-IN")}</del>{" "}
                  {product.discountPercentage}% off
                </small>
              )}
            </div>
            {reviewCount > 0 && (
              <button
                className="pdp-rating"
                onClick={() => setOpenAccordion(3)}
                aria-label={`Read ${reviewCount} reviews, rated ${rating} out of 5`}
              >
                <span
                  style={{ "--rating": `${rating * 20}%` }}
                  aria-hidden="true"
                >
                  ★★★★★
                </span>
                <small>({reviewCount})</small>
              </button>
            )}
            {product.description && (
              <div className="pdp-description">
                <p className={showFullDesc ? "" : "pdp-description-clamped"}>
                  {product.description}
                </p>
                <button
                  onClick={() => setShowFullDesc((value) => !value)}
                  aria-expanded={showFullDesc}
                >
                  {showFullDesc ? "Less" : "More"}
                  <ChevronDownIcon className={showFullDesc ? "is-open" : ""} />
                </button>
              </div>
            )}
            <div className="pdp-color-section">
              <div className="pdp-section-label">
                <h2>Available Colors</h2>
                <span>
                  {product.variants.length}{" "}
                  {product.variants.length === 1 ? "color" : "colors"}
                </span>
              </div>
              <div className="pdp-colors">
                {product.variants.map((color, index) => (
                  <button
                    key={color._id || index}
                    aria-label={`Select ${color.color} color`}
                    aria-pressed={selectedVariantIndex === index}
                    onClick={() => handleVariantChange(index)}
                  >
                    <img
                      src={formatImageUrl(color.images?.[0])}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              <p className="pdp-color-name">{variant.color}</p>
            </div>
            <div className="pdp-size-section">
              <div className="pdp-section-label">
                <h2>Select Size{footwear ? " (UK)" : ""}</h2>
                <button
                  ref={sizeGuideButton}
                  onClick={() => setSizeGuideOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={sizeGuideOpen}
                >
                  Size Guide <ChevronRightIcon />
                </button>
              </div>
              <div className="pdp-sizes">
                {sizes.map(({ size, stock }) => (
                  <button
                    key={size}
                    disabled={stock <= 0}
                    aria-pressed={selectedSize === size}
                    onClick={() => handleSizeSelect(size)}
                  >
                    {footwear && /^UK\s*/i.test(size) ? (
                      <>
                        <span>UK</span>
                        <span>{size.replace(/^UK\s*/i, "")}</span>
                      </>
                    ) : (
                      size
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="pdp-purchase-actions">
              {!cartItem ? (
                <button
                  className="pdp-add-to-bag"
                  onClick={handleAddToBag}
                  disabled={
                    !selectedSize || isProcessing || selectedSizeStock === 0
                  }
                >
                  {isProcessing ? "Adding…" : "Add to Bag"}
                  <ArrowRightIcon />
                </button>
              ) : (
                <div className="pdp-quantity">
                  <button
                    aria-label={
                      cartItem.quantity === 1
                        ? "Remove from bag"
                        : "Decrease quantity"
                    }
                    onClick={() => handleQuantityChange(-1)}
                    disabled={isProcessing}
                  >
                    {cartItem.quantity === 1 ? <XMarkIcon /> : <MinusIcon />}
                  </button>
                  <span aria-live="polite">{cartItem.quantity} in bag</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      isProcessing || cartItem.quantity >= selectedSizeStock
                    }
                  >
                    <PlusIcon />
                  </button>
                </div>
              )}
              <button
                className={`pdp-favorite ${isInWishlist ? "is-saved" : ""}`}
                aria-label={
                  isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                }
                aria-pressed={isInWishlist}
                disabled={wishlistLoading}
                aria-busy={Boolean(wishlistLoading)}
                onClick={handleWishlistToggle}
              >
                {wishlistLoading ? (
                  <WishlistSpinner />
                ) : (
                  <HeartIcon />
                )}
              </button>
            </div>
            {!selectedSize && (
              <p className="pdp-size-hint">Choose your size to add to bag.</p>
            )}
            <div className="pdp-service-strip">
              <div>
                <TruckIcon />
                <p>
                  <strong>Free Delivery</strong>
                  <small>On orders above ₹1,000</small>
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
            <div className="pdp-details-rows">
              <AccordionItem
                id="pdp-product-details"
                title="Product Details"
                icon={DocumentTextIcon}
                isOpen={openAccordion === 0}
                onClick={() => setOpenAccordion(openAccordion === 0 ? null : 0)}
              >
                <p className="pdp-preformatted">
                  {product.productDetails ||
                    product.description ||
                    "Explore the product images, available colors and sizes above."}
                </p>
              </AccordionItem>
              <AccordionItem
                id="pdp-delivery"
                title="Delivery & Returns"
                icon={TruckIcon}
                isOpen={openAccordion === 2}
                onClick={() => setOpenAccordion(openAccordion === 2 ? null : 2)}
              >
                <p>
                  Free delivery on orders above ₹1,000. Easy 30-day returns.
                </p>
              </AccordionItem>
              <AccordionItem
                id="pdp-reviews"
                title={`Reviews (${reviewCount})`}
                icon={ChatBubbleLeftRightIcon}
                isOpen={openAccordion === 3}
                onClick={() => setOpenAccordion(openAccordion === 3 ? null : 3)}
              >
                <ProductReviewSection productId={product._id} />
              </AccordionItem>
            </div>
            {product.videoUrl && (
              <section className="pdp-video">
                <h2>Visual Preview</h2>
                <iframe
                  src={product.videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${product.name} video`}
                />
              </section>
            )}
          </section>
        </div>
        <ProductSuggestions productSlug={product.slug} />
      </main>
      <Footer />
      <SizeGuide
        open={sizeGuideOpen}
        product={product}
        sizes={sizes}
        selectedSize={selectedSize}
        onSelect={handleSizeSelect}
        onClose={closeSizeGuide}
        returnFocusRef={sizeGuideButton}
      />
    </div>
  );
};

export default ProductDetails;
