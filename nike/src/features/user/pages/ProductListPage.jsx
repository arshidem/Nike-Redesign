import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { useProductService } from '../../product/services/productService';
import { useWishlistService } from '../services/wishlistServices';
import { BackBar, HeartIcon } from '../../../shared/ui/Icons';
import Footer from '../components/Footer';
import { ModelSkeleton } from '../../../shared/ui/Skeleton';
import { toast } from 'react-hot-toast';

const ProductListPage = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchProducts } = useProductService();
  const { toggleWishlist, getWishlist } = useWishlistService();
  const { backendUrl, user } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState({});

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.jpg';
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i);
    const relativePath = match ? match[0].replace(/\\/g, '/') : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  useEffect(() => {
    if (typeof title !== "string") {
      console.error("🚨 title prop is not a string:", title);
    }
  }, [title]);

  // Load products and wishlist
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products
        const searchParams = new URLSearchParams(location.search);
        const filters = Object.fromEntries(searchParams.entries());
        const { products: productList } = await fetchProducts(filters);
        setProducts(productList);

        // Load wishlist if user is logged in
        if (user) {
          const response = await getWishlist();
          const wishlistProductIds = response.data.map(product => product._id);
          setWishlistIds(wishlistProductIds);
        }
      } catch (err) {
        console.error('Failed to load data', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.search, user]);

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistIds.includes(productId);
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setWishlistLoading(prev => ({ ...prev, [productId]: true }));
      
      const response = await toggleWishlist(productId);
      
      // Update wishlist state
      const updatedWishlistIds = response.wishlist.map(product => product._id);
      setWishlistIds(updatedWishlistIds);

      toast.success(
        response.action === 'added' 
          ? 'Added to wishlist!' 
          : 'Removed from wishlist!'
      );
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
      toast.error(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="p-6">
      <BackBar />

      <h1 className="text-xl font-bold mb-2 mt-10">
        {title} ({products.length})
      </h1>

      {loading ? (
        <ModelSkeleton />
      ) : (
        <div className="flex flex-col md:flex-row gap-5 mt-1">
          <div className="w-full md:w-3/4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {products.map((product) => {
              const rawImage = product?.variants?.[0]?.images?.[0];
              const image = formatImageUrl(rawImage);
              const isLoading = wishlistLoading[product._id];
              const isWishlisted = isInWishlist(product._id);

              return (
                <Link
                  to={`/product/${product.slug}`}
                  key={product._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition block p-4 relative"
                >
                  {/* Wishlist button */}
                  <button
                    onClick={(e) => handleWishlistToggle(product._id, e)}
                    className={`absolute top-6 right-6 p-1 rounded-full shadow ${
                      isWishlisted ? 'bg-red-50' : 'bg-white'
                    }`}
                    aria-label={
                      isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? (
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
                          isWishlisted 
                            ? 'fill-red-600 stroke-none' 
                            : 'fill-none stroke-black'
                        }`}
                      />
                    )}
                  </button>

                  <img
                    src={image}
                    alt={product.name}
                    className="w-full object-contain mb-4"
                    loading="lazy"
                  />
                  <span className="text-red-600 font-semibold text-sm">
                    {product.tag}
                  </span>
                  <h2 className="text-sm font-semibold">{product.name}</h2>
                  <p className="text-gray-500 text-sm">{product.gender}</p>
                  <p className="text-gray-700 font-medium mt-1">
                    MRP : ₹ {product.price?.toLocaleString()}
                  </p>
                </Link>
              );
            })}
            {products.length === 0 && <p>No products found.</p>}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductListPage;