import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { useProductService } from '../../product/services/productService';
import { BackBar } from '../../../shared/ui/Icons';
import Footer from '../components/Footer';
import { ModelSkeleton } from '../../../shared/ui/Skeleton';

const ProductListPage = ({ title }) => {
  const location = useLocation();
  const { fetchProducts } = useProductService();
  const { backendUrl } = useAppContext();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.jpg';
    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i);
    const relativePath = match ? match[0].replace(/\\/g, '/') : imagePath;
    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const searchParams = new URLSearchParams(location.search);
        const filters = Object.fromEntries(searchParams.entries());
        const { products: productList } = await fetchProducts(filters);
        setProducts(productList);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [location.search]);

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

              return (
                <Link
                  to={`/product/${product.slug}`}
                  key={product._id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition block p-4"
                >
                  <img
                    src={image}
                    alt={product.name}
                    className="w-full object-contain mb-4"
                    loading="lazy"
                  />
                  <span className="text-red-600 font-semibold text-sm">{product.tag}</span>
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
