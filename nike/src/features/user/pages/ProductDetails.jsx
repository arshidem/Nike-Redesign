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
} from "../../../shared/ui/Icons";
import Loader from "../../../shared/ui/Loader";
import useCartServices from "../services/cartServices";

const AccordionItem = ({ title, children, isOpen, onClick }) => {
  return (
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
};
const ProductDetails = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAddedToBag, setIsAddedToBag] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingCart, setIsCheckingCart] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [cartItem, setCartItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { fetchProductBySlug } = useProductService();
  const { backendUrl } = useAppContext();
  const { addToCart, updateItemQuantity, removeItem, getCart } = useCartServices();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };
useEffect(() => {
  if (!product) return;

  const currentVariant = product.variants?.[selectedVariantIndex];
  const image = currentVariant?.images?.[0];
  setSelectedImage(image ? formatImageUrl(image) : "/placeholder.jpg");
}, [product, selectedVariantIndex]);
  // Load product details
  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const data = await fetchProductBySlug(productSlug);

        if (isMounted) {
          if (data) {
            setProduct(data);
            setSelectedImage(formatImageUrl(data.variants?.[0]?.images?.[0]));
            setSelectedSize(null);
          } else {
            navigate("/not-found", { replace: true });
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to load product details");
          navigate("/products", { replace: true });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productSlug, navigate]);

  // Check if item is already in cart
  useEffect(() => {
    if (!product) return;

    const variant = product.variants[selectedVariantIndex];
    if (!variant || !selectedSize) {
      setIsAddedToBag(false);
      setCartItem(null);
      return;
    }

    const checkCart = async () => {
      try {
        setIsCheckingCart(true);
        const cart = await getCart();

        const existingItem = cart.items.find(
          (item) =>
            item.product === product._id &&
            item.variantId === variant._id &&
            item.size === selectedSize
        );

        setCartItem(existingItem || null);
        setIsAddedToBag(!!existingItem);
      } catch (error) {
        setCartItem(null);
        setIsAddedToBag(false);
      } finally {
        setIsCheckingCart(false);
      }
    };

    checkCart();
  }, [product, selectedVariantIndex, selectedSize, getCart]);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const handleVariantChange = (index) => {
    const variant = product.variants[index];
    setSelectedVariantIndex(index);
    setSelectedImage(formatImageUrl(variant?.images?.[0]));
    setSelectedSize(null);
    setIsAddedToBag(false);
    setCartItem(null);
  };

const handleAddToBag = async () => {
  const variant = product?.variants?.[selectedVariantIndex];

  if (!selectedSize) {
    toast.error("Please select a size before adding to bag");
    return;
  }

  if (!variant) {
    toast.error("Invalid product variant");
    return;
  }

  // 🧠 Get stock from selected size
  const selectedSizeObj = variant.sizes.find((s) => s.size === selectedSize);
  const availableStock = selectedSizeObj?.stock || 0;
  

  try {
    setIsProcessing(true);

    const imageUrl = formatImageUrl(variant.images?.[0]);

  const cart = await addToCart({
  productId: product._id,
  variantId: variant._id,
  name: product.name,
  image: imageUrl,
  color: variant.color,
  size: selectedSize,
  price: product.finalPrice,
  quantity: 1,
  stock: availableStock,
  gender: product.gender,  // ✅ add this only if backend requires it
});


    const addedItem = cart.items.find(
      (item) =>
        item.productId === product._id &&
        item.variantId === variant._id &&
        item.size === selectedSize
    );

    if (addedItem) {
      setCartItem(addedItem);
      setIsAddedToBag(true);

      toast.success(
        <div className="flex items-center gap-2">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-10 h-10 object-cover rounded"
          />
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm">Size: {selectedSize}</p>
          </div>
        </div>,
        { duration: 3000 }
      );
    }
  } catch (error) {
    toast.error(error?.response?.data?.message || "Failed to add to bag");
  } finally {
    setIsProcessing(false);
  }
};


  const handleQuantityChange = async (delta) => {
    if (!cartItem || isProcessing) return;

    try {
      setIsProcessing(true);
      const newQty = cartItem.quantity + delta;

      if (newQty < 1) {
        await removeItem(cartItem._id);
        setCartItem(null);
        setIsAddedToBag(false);
        toast("Removed from bag", { icon: <BagIcon /> });
      } else {
        const updatedCart = await updateItemQuantity(cartItem._id, newQty);
        const updatedItem = updatedCart.items.find((i) => i._id === cartItem._id);
        setCartItem(updatedItem);
      }
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setIsProcessing(false);
    }
  };

  // Conditional rendering
  if (isLoading) return <div><Loader/></div>;
  if (!product) return <div className="text-center p-6">Product not found</div>;

  const variant = product.variants[selectedVariantIndex];
  const thumbnails = variant?.images?.map((img) => formatImageUrl(img)) || [];
  const sizes = variant?.sizes || [];
  const selectedSizeStock = sizes.find((s) => s.size === selectedSize)?.stock || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-gray-600 hover:text-black">
        <ArrowIconLeft className="w-5 h-5" />
        <span className="ml-2">Back</span>
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product images */}
        <div className="w-full lg:w-1/2">
          <img src={selectedImage} alt="product" className="w-full aspect-square object-cover rounded" />
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {thumbnails.map((thumb, idx) => (
              <img
                key={idx}
                src={thumb}
                onClick={() => setSelectedImage(thumb)}
                alt={`Thumbnail ${idx + 1}`}
                onError={(e) => (e.target.src = "/placeholder.jpg")}
                className={`w-20 h-20 rounded object-cover border ${
                  selectedImage === thumb ? "border-black" : "border-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Available Variants */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Available Variants</h4>
            <div className="flex gap-2">
              {product.variants.map((v, index) => (
                <button
                  key={index}
                  onClick={() => handleVariantChange(index)}
                  className={`border-2 rounded overflow-hidden w-12 h-12 ${
                    selectedVariantIndex === index ? "border-black" : "border-gray-200"
                  }`}
                >
                  <img
                    src={formatImageUrl(v.images?.[0])}
                    alt={`Variant ${index + 1}`}
                    className="object-cover w-full h-full"
                    onError={(e) => (e.target.src = "/placeholder.jpg")}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="w-full lg:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <div className="text-xl font-semibold text-gray-800">₹{product.finalPrice}</div>
          {product.discountPercentage > 0 && (
            <div className="text-sm text-red-600">
              <span className="line-through mr-2 text-gray-400">₹{product.price}</span>
              ({product.discountPercentage}% OFF)
            </div>
          )}

          <div>
            <h4 className="font-semibold">Select Size</h4>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {sizes.map(({ size, stock }, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSize(size)}
                  disabled={stock === 0}
                  className={`border p-2 rounded text-sm ${
                    selectedSize === size ? "bg-black text-white" : ""
                  } ${stock === 0 ? "line-through text-gray-400 cursor-not-allowed" : "hover:border-black"}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {!isAddedToBag ? (
              <button
                onClick={handleAddToBag}
                disabled={!selectedSize || selectedSizeStock === 0 || isProcessing}
                className="w-full py-3 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              >
                {isProcessing ? "Adding..." : "Add to Bag"}
              </button>
            ) : (
              <div className="flex items-center justify-between border border-black px-4 py-2 rounded-full">
                <button onClick={() => handleQuantityChange(-1)} disabled={isProcessing}>
                  {cartItem.quantity === 1 ? <XIcon /> : <MinusIcon />}
                </button>
                <span>{cartItem.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={isProcessing || cartItem.quantity >= selectedSizeStock}
                >
                  <PlusIcon />
                </button>
              </div>
            )}
          </div>

          {/* Product Description */}
         {product.description && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Accordion Sections */}
          <div className="pt-4 border-t">
            <AccordionItem
              title="Delivery & Returns"
              isOpen={openAccordion === 0}
              onClick={() => toggleAccordion(0)}
            >
              <p>Free delivery on orders above ₹1000. Easy 30-day returns.</p>
            </AccordionItem>

            <AccordionItem
              title="Product Details"
              isOpen={openAccordion === 1}
              onClick={() => toggleAccordion(1)}
            >
              {product.productDetails && (
                <div className="pt-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {product.productDetails}
                  </pre>
                </div>
              )}
            </AccordionItem>

            {product.videoUrl && (
              <AccordionItem
                title="Video"
                isOpen={openAccordion === 2}
                onClick={() => toggleAccordion(2)}
              >
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    src={product.videoUrl}
                    className="w-full h-64"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${product.name} video`}
                  ></iframe>
                </div>
              </AccordionItem>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
