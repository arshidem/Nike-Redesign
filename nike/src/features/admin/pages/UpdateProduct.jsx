import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { useAppContext } from "../../../context/AppContext";
import { div } from "framer-motion/client";
import { useProductService } from "../../product/services/productService";
import { UpdateProductSkeleton } from "../../../shared/ui/Skeleton";
const UpdateProduct = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const { backendUrl, token } = useAppContext();
  const { updateProduct, fetchProductBySlug } = useProductService();
  const [formData, setFormData] = useState({
    name: "",
    productDetails: "",
    price: "",
    discountPercentage: 0,
    description: "",
    category: "",
    model: "",
    gender: "unisex",
    activityType: "casual",
    sportType: "other",
    isFeatured: false,
    isTrending: false,
    metaTitle: "",
    metaDescription: "",
    tags: [],
    badges: [],
    videoUrl: "",
    featuredImage: null,
    variants: [
      {
        color: "",
        images: [],
        sizes: [{ size: "", stock: 0 }],
      },
    ],
  });

  const SHOE_SIZES = [
    "UK 5.5",
    "UK 6 (EU 39)",
    "UK 6 (EU 40)",
    "UK 6.5",
    "UK 7",
    "UK 7.5",
    "UK 8",
    "UK 8.5",
    "UK 9",
    "UK 9.5",
    "UK 10",
    "UK 10.5",
    "UK 11",
    "UK 11.5",
    "UK 12",
    "UK 13",
  ];

  const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL"];

  const ACTIVITY_TYPES = [
    "running",
    "training",
    "hiking",
    "walking",
    "cycling",
    "sports",
    "casual",
    "other",
  ];

  const SPORT_TYPES = [
    "football",
    "basketball",
    "tennis",
    "cricket",
    "baseball",
    "golf",
    "volleyball",
    "badminton",
    "table-tennis",
    "rugby",
    "hockey",
    "swimming",
    "athletics",
    "boxing",
    "mma",
    "skateboarding",
    "surfing",
    "snowboarding",
    "skiing",
    "other",
  ];

  // Image URL formatter
  const formatImageUrl = useCallback(
    (imagePath) => {
      if (!imagePath) return "/placeholder.jpg";

      const match = imagePath.match(
        /uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i
      );
      const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;

      return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
    },
    [backendUrl]
  );


  useEffect(() => {
    // This is the cleanup function that will run on unmount
    return () => {
      formData.variants.forEach(variant => {
        variant.images.forEach(img => {
          if (img.preview && !img.isExisting) {
            URL.revokeObjectURL(img.preview);
          }
        });
      });
      if (formData.featuredImage?.preview && !formData.featuredImage.isExisting) {
        URL.revokeObjectURL(formData.featuredImage.preview);
      }
    };
  }, []);


  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await fetchProductBySlug(slug);

        if (!product) {
          throw new Error("Product not found");
        }
console.log(product.variants);

     // In your variant state, keep track of images to remove
const variantsWithImages = product.variants?.map((variant) => ({
  ...variant,
  images: variant.images?.map((img) => ({
    url: img,
    preview: formatImageUrl(img),
    isExisting: true,
  })) || [],
  imagesToRemove: [], // Add this to track images to remove
})) || [];

        // Process featured image
        const featuredImg = product.featuredImg
          ? {
              url: product.featuredImg,
              preview: formatImageUrl(product.featuredImg),
              isExisting: true,
            }
          : null;

        setFormData({
          ...product,
          variants: variantsWithImages,
          featuredImage: featuredImg,
          activityType: product.activityType || "casual",
          sportType: product.sportType || "other",
        });
      } catch (err) {
        setError(
          err.response?.data?.error || err.message || "Failed to fetch product"
        );
      } finally {
        setFetching(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, formatImageUrl]);

  // Handle image errors
  const handleImageError = (e) => {
    e.target.src = "/placeholder.jpg";
    e.target.className = "w-full h-24 object-contain p-2 bg-gray-100";
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (name === "category") {
      const lowerCaseValue = value.toLowerCase();
      if (
        lowerCaseValue.includes("shoe") ||
        lowerCaseValue.includes("footwear")
      ) {
        autoFillSizes(SHOE_SIZES);
      } else if (
        lowerCaseValue.includes("cloth") ||
        lowerCaseValue.includes("apparel")
      ) {
        autoFillSizes(CLOTHING_SIZES);
      }
    }
  };

  const autoFillSizes = (sizeOptions) => {
    const variants = [...formData.variants];

    variants.forEach((variant) => {
      // Clear existing sizes
      variant.sizes = [];

      // Add all size options with 0 stock initially
      sizeOptions.forEach((size) => {
        variant.sizes.push({
          size,
          stock: 0,
        });
      });
    });
    setFormData((prev) => ({
      ...prev,
      variants,
    }));
  };

  // Handle variant changes
  const handleVariantChange = (index, field, value) => {
    const variants = [...formData.variants];
    variants[index][field] = value;
    setFormData({ ...formData, variants });
  };

  // Handle size changes
  const handleSizeChange = (vIndex, sIndex, field, value) => {
    const variants = [...formData.variants];
    variants[vIndex].sizes[sIndex][field] =
      field === "stock" ? parseInt(value) || 0 : value;
    setFormData({ ...formData, variants });
  };

  // Add new variant
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { color: "", images: [], sizes: [{ size: "", stock: 0 }] },
      ],
    });
  };

  // Add new size to variant
  const addSize = (index) => {
    const variants = [...formData.variants];
    variants[index].sizes.push({ size: "", stock: 0 });
    setFormData({ ...formData, variants });
  };

  // Remove variant
  const removeVariant = (index) => {
    const variants = [...formData.variants];
    // Clean up image URLs
    variants[index].images.forEach((img) => {
      if (img.preview && !img.isExisting) {
        URL.revokeObjectURL(img.preview);
      }
    });

    setFormData({
      ...formData,
      variants: variants.filter((_, i) => i !== index),
    });
  };

  // Remove size from variant
  const removeSize = (vIndex, sIndex) => {
    const variants = [...formData.variants];
    variants[vIndex].sizes = variants[vIndex].sizes.filter(
      (_, i) => i !== sIndex
    );
    setFormData({ ...formData, variants });
  };

  // Handle variant image upload
  const handleVariantImageDrop = (acceptedFiles, variantIndex) => {
    if (acceptedFiles.length === 0) return;

    const currentImages = formData.variants[variantIndex].images;
    if (currentImages.length + acceptedFiles.length > 7) {
      setError("Maximum 7 images per variant allowed");
      return;
    }

    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));

    const variants = [...formData.variants];
    variants[variantIndex].images = [...currentImages, ...newImages];
    setFormData({ ...formData, variants });
  };

  // Remove variant image
const removeVariantImage = (variantIndex, imgIndex) => {
  const variants = [...formData.variants];
  const imageToRemove = variants[variantIndex].images[imgIndex];

  if (imageToRemove.isExisting) {
    // For existing images, mark them for removal
    variants[variantIndex].imagesToRemove = [
      ...(variants[variantIndex].imagesToRemove || []),
      imageToRemove.url
    ];
  } else if (imageToRemove.preview) {
    // For new images, revoke the object URL
    URL.revokeObjectURL(imageToRemove.preview);
  }

  variants[variantIndex].images.splice(imgIndex, 1);
  setFormData({ ...formData, variants });
};

  // Handle featured image upload
  const handleFeaturedImageDrop = (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    // Revoke previous preview URL if it exists
    if (formData.featuredImage?.preview && !formData.featuredImage.isExisting) {
      URL.revokeObjectURL(formData.featuredImage.preview);
    }

    setFormData((prev) => ({
      ...prev,
      featuredImage: {
        file,
        preview: URL.createObjectURL(file),
        isNew: true,
      },
    }));
  };

  // Remove featured image
  const removeFeaturedImage = () => {
    // Revoke object URL if it's a new image
    if (formData.featuredImage?.preview && !formData.featuredImage.isExisting) {
      URL.revokeObjectURL(formData.featuredImage.preview);
    }
    setFormData((prev) => ({ ...prev, featuredImage: null }));
  };

  // Variant Image Uploader Component
  const VariantImageUploader = ({ variant, variantIndex }) => {
    const onDrop = useCallback(
      (acceptedFiles) => {
        handleVariantImageDrop(acceptedFiles, variantIndex);
      },
      [variantIndex]
    );

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: { "image/*": [] },
      maxFiles: 7 - variant.images.length,
    });

    return (
      <div className="space-y-2">
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-blue-400"
        >
          <input {...getInputProps()} />
          <p className="text-gray-500">
            Drag & drop images here, or click to select
          </p>
          <p className="text-xs text-gray-400">
            ({variant.images.length}/7 images)
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {variant.images.map((img, imgIndex) => (
            <div key={imgIndex} className="relative group">
              <img
                src={img.preview || formatImageUrl(img.url)}
                alt={`Variant ${variantIndex + 1} preview ${imgIndex + 1}`}
                className="w-full h-full object-cover rounded border"
                onError={handleImageError}
              />
              <button
                type="button"
                onClick={() => removeVariantImage(variantIndex, imgIndex)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Featured Image Uploader Component
  const FeaturedImageUploader = () => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: handleFeaturedImageDrop,
      accept: { "image/*": [] },
      maxFiles: 1,
    });

    return (
      <div className="space-y-2">
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:border-blue-400"
        >
          <input {...getInputProps()} />
          {formData.featuredImage ? (
            <div className="relative">
              <img
                src={
                  formData.featuredImage.preview ||
                  formatImageUrl(formData.featuredImage.url)
                }
                alt="Featured preview"
                className="w-full h-48 object-contain mx-auto"
                onError={handleImageError}
              />
            </div>
          ) : (
            <p className="text-gray-500">
              Drag & drop featured image here, or click to select
            </p>
          )}
        </div>

        {formData.featuredImage && (
          <button
            type="button"
            onClick={removeFeaturedImage}
            className="mt-2 text-red-500 text-xs sm:text-sm hover:text-red-700"
          >
            Remove Featured Image
          </button>
        )}
      </div>
    );
  };

  // Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const formDataToSend = new FormData();

    // Append simple fields
    const fields = [
      'name', 'productDetails', 'price', 'discountPercentage', 
      'description', 'category', 'model', 'gender',
      'activityType', 'sportType', 'isFeatured', 'isTrending',
      'metaTitle', 'metaDescription', 'videoUrl'
    ];
    
    fields.forEach(field => {
      if (formData[field] !== undefined) {
        formDataToSend.append(field, formData[field]);
      }
    });

    // Handle featured image
    if (formData.featuredImage?.file) {
      formDataToSend.append('featuredImg', formData.featuredImage.file);
    } else if (formData.featuredImage === null) {
      formDataToSend.append('removeFeaturedImg', 'true');
    }

    // Prepare variants data
    const variantsData = formData.variants.map(variant => ({
      color: variant.color,
      sizes: variant.sizes,
      images: variant.images.map(img => ({
        url: img.url,
        isExisting: img.isExisting
      })),
      imagesToRemove: variant.imagesToRemove || []
    }));

    formDataToSend.append('variants', JSON.stringify(variantsData));

    // Append variant images with correct field names
    formData.variants.forEach((variant, index) => {
      variant.images.forEach(img => {
        if (img.file && !img.isExisting) {
          formDataToSend.append(`variant_${index}_images`, img.file);
        }
      });
    });

    // Append tags and badges if they exist
    if (formData.tags?.length > 0) {
      formDataToSend.append('tags', JSON.stringify(formData.tags));
    }
    if (formData.badges?.length > 0) {
      formDataToSend.append('badges', JSON.stringify(formData.badges));
    }

    // Send the request
    const response = await axios.put(
      `${backendUrl}/api/products/${slug}`,
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    navigate(`/admin/product/${slug}`, {
      state: { success: "Product updated successfully" }
    });
  } catch (err) {
    setError(err.response?.data?.error || "Failed to update product");
  } finally {
    setLoading(false);
  }
};

   // Helper function to determine if category is shoe/footwear related
  const isShoesCategory = (category) => {
    const lowerCategory = category.toLowerCase();
    return lowerCategory.includes("shoe") || lowerCategory.includes("footwear");
  };

  // Helper function to determine if category is clothing related
  const isClothingCategory = (category) => {
    const lowerCategory = category.toLowerCase();
    return lowerCategory.includes("cloth") || lowerCategory.includes("apparel");
  };

  // Helper function to get appropriate size options
  const getSizeOptions = (category) => {
    if (isShoesCategory(category)) {
      return SHOE_SIZES;
    } else if (isClothingCategory(category)) {
      return CLOTHING_SIZES;
    }
    return [];
  };

  const handleBack = () => {
    navigate(`/admin/product/${slug}`);
  };

  if (fetching) {
    return (
     <UpdateProductSkeleton/>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={handleBack}
          className="text-blue-500 hover:underline"
        ></button>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed bg-white p-2 w-full shadow  items-center z-10">
        <button
          onClick={() => navigate(`/admin/product/${slug}`)}
          className=" px-3 py-1 sm:px-4 sm:py-2 border border-black rounded hover:bg-gray-200 transition sm:w-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className={`size-4 transition-transform duration-300 rotate-180`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5L15.75 12 8.25 19.5"
            />
          </svg>
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Feature Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Product Details
                </label>
                <textarea
                  type="text"
                  name="productDetails"
                  value={formData.productDetails}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Price*
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Gender*
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sport Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sport Type
                </label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SPORT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flags */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-700">Featured</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleChange}
                    className="h-4 w-4 text-xs sm:text-sm text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-700">Trending</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
              />
            </div>
          </div>

          {/* Featured Image Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Featured Image</h2>
            <FeaturedImageUploader />
          </div>

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Product Variants</h2>

            {formData.variants.map((variant, variantIndex) => (
              <div
                key={variantIndex}
                className="mb-8 border-b pb-6 last:border-b-0"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-md">
                    Variant {variantIndex + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                    disabled={formData.variants.length <= 1}
                  >
                    Remove Variant
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Color */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Color*
                    </label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) =>
                        handleVariantChange(
                          variantIndex,
                          "color",
                          e.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Images* (Minimum 2 required)
                    </label>
                    <VariantImageUploader
                      variant={variant}
                      variantIndex={variantIndex}
                    />
                  </div>
                </div>

                {/* Sizes */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700">
                      Sizes & Stock*
                    </h4>
                    <button
                      type="button"
                      onClick={() => addSize(variantIndex)}
                      className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                    >
                      + Add Size
                    </button>
                    {(isShoesCategory(formData.category) ||
                      isClothingCategory(formData.category)) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isShoesCategory(formData.category)) {
                            autoFillSizes(SHOE_SIZES);
                          } else if (isClothingCategory(formData.category)) {
                            autoFillSizes(CLOTHING_SIZES);
                          }
                        }}
                        className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                      >
                        Reset to Default Sizes
                      </button>
                    )}
                  </div>

                  {variant.sizes.map((size, sizeIndex) => (
                    <div
                      key={sizeIndex}
                      className="grid grid-cols-3 gap-3 mb-3"
                    >
                      {/* Size Selector */}
                      {isShoesCategory(formData.category) ||
                      isClothingCategory(formData.category) ? (
                        <select
                          value={size.size}
                          onChange={(e) =>
                            handleSizeChange(
                              variantIndex,
                              sizeIndex,
                              "size",
                              e.target.value
                            )
                          }
                          className=" text-xs sm:text-sm border p-2 rounded"
                          required
                        >
                          <option value="">Select Size</option>
                          {getSizeOptions(formData.category).map(
                            (sizeOption, i) => (
                              <option key={i} value={sizeOption}>
                                {sizeOption}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Size (e.g., S, M, L)"
                          value={size.size}
                          onChange={(e) =>
                            handleSizeChange(
                              variantIndex,
                              sizeIndex,
                              "size",
                              e.target.value
                            )
                          }
                          className="border p-2 rounded text-xs sm:text-sm"
                          required
                        />
                      )}
                      <input
                        type="number"
                        placeholder="Stock"
                        value={size.stock}
                        onChange={(e) =>
                          handleSizeChange(
                            variantIndex,
                            sizeIndex,
                            "stock",
                            e.target.value
                          )
                        }
                        className="border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(variantIndex, sizeIndex)}
                        className="text-red-500 hover:text-red-700 text-xs sm:text-sm"
                        disabled={variant.sizes.length <= 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addVariant}
              className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-xs sm:text-sm"
            >
              + Add Another Variant
            </button>
          </div>

          {/* SEO & Marketing Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">SEO & Marketing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Title */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <input
                  type="text"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((tag) => tag.trim());
                    setFormData({ ...formData, tags });
                  }}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="running, casual, limited"
                />
              </div>

              {/* Badges */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Badges
                </label>
                <input
                  type="text"
                  name="badges"
                  value={formData.badges.join(", ")}
                  onChange={(e) => {
                    const badges = e.target.value
                      .split(",")
                      .map((badge) => badge.trim());
                    setFormData({ ...formData, badges });
                  }}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="New, Limited, Hot"
                />
              </div>

              {/* Video URL */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full border text-xs sm:text-sm border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://youtube.com/embed/..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="text-xs sm:text-smpx-3 py-1 sm:px-4 sm:py-2 border border-black rounded hover:bg-black hover:text-white transition w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 border border-black rounded hover:bg-black hover:text-white transition w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Updating...
                </span>
              ) : (
                "Update Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1"
    stroke="currentColor"
    className="size-3.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

export default UpdateProduct;
