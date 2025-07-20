import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { useAppContext } from "../../../context/AppContext";
import toast, { Toaster } from 'react-hot-toast';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { backendUrl, token } = useAppContext();

  const initialFormState = {
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
    featuredImg: null,
    variants: [
      {
        color: "",
        images: [],
        sizes: [{ size: "", stock: 0 }],
      },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

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
    "UK 13"
  ];

  const CLOTHING_SIZES = ["S", "M", "L", "XL", "2XL"];

  const ACTIVITY_TYPES = [
    "running", "training", "hiking", "walking", 
    "cycling", "sports", "casual", "other"
  ];

  const SPORT_TYPES = [
    "football", "basketball", "tennis", "cricket", "baseball",
    "golf", "volleyball", "badminton", "table-tennis", "rugby",
    "hockey", "swimming", "athletics", "boxing", "mma",
    "skateboarding", "surfing", "snowboarding", "skiing", "other"
  ];

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (formData.featuredImg?.preview) {
        URL.revokeObjectURL(formData.featuredImg.preview);
      }
      formData.variants.forEach(variant => {
        variant.images.forEach(img => {
          if (img.preview) URL.revokeObjectURL(img.preview);
        });
      });
    };
  }, []);

  // Calculate final price
  useEffect(() => {
    if (formData.price && formData.discountPercentage) {
      const numericPrice = parseFloat(formData.price);
      const discount = parseFloat(formData.discountPercentage);
      const finalPrice = Math.round(numericPrice * (100 - discount) / 100);
      setFormData(prev => ({ ...prev, finalPrice }));
    }
  }, [formData.price, formData.discountPercentage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "category") {
      const lowerCaseValue = value.toLowerCase();
      if (lowerCaseValue.includes("shoe") || lowerCaseValue.includes("footwear")) {
        autoFillSizes(SHOE_SIZES);
      } else if (lowerCaseValue.includes("cloth") || lowerCaseValue.includes("apparel")) {
        autoFillSizes(CLOTHING_SIZES);
      }
    }
  };

  const autoFillSizes = (sizeOptions) => {
    const variants = [...formData.variants];
    
    variants.forEach(variant => {
      variant.sizes = [];
      sizeOptions.forEach(size => {
        variant.sizes.push({
          size,
          stock: 0
        });
      });
    });
    
    setFormData(prev => ({
      ...prev,
      variants
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const variants = [...formData.variants];
    variants[index][field] = value;
    setFormData({ ...formData, variants });
  };

  const handleSizeChange = (vIndex, sIndex, field, value) => {
    const variants = [...formData.variants];
    variants[vIndex].sizes[sIndex][field] =
      field === "stock" ? parseInt(value) || 0 : value;
    setFormData({ ...formData, variants });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          color: "",
          images: [],
          sizes: [{ size: "", stock: 0 }],
        },
      ],
    });
  };

  const addSize = (vIndex) => {
    const variants = [...formData.variants];
    variants[vIndex].sizes.push({ size: "", stock: 0 });
    setFormData({ ...formData, variants });
  };

  const removeVariant = (index) => {
    const variants = formData.variants.filter((_, i) => i !== index);
    formData.variants[index].images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setFormData({ ...formData, variants });
  };

  const removeSize = (vIndex, sIndex) => {
    const variants = [...formData.variants];
    variants[vIndex].sizes = variants[vIndex].sizes.filter((_, i) => i !== sIndex);
    setFormData({ ...formData, variants });
  };

  const handleVariantImageUpload = (variantIndex, acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      isNew: true
    }));

    const variants = [...formData.variants];
    variants[variantIndex].images = [...variants[variantIndex].images, ...newImages];
    setFormData({ ...formData, variants });
  };

  const removeVariantImage = (variantIndex, imgIndex) => {
    const variants = [...formData.variants];
    const removedImage = variants[variantIndex].images[imgIndex];
    
    if (removedImage.preview) {
      URL.revokeObjectURL(removedImage.preview);
    }
    
    variants[variantIndex].images.splice(imgIndex, 1);
    setFormData({ ...formData, variants });
  };

  const handleFeaturedImageUpload = (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFormData(prev => ({
      ...prev,
      featuredImg: {
        file,
        preview: URL.createObjectURL(file),
        name: file.name
      }
    }));
  };

  const removeFeaturedImage = () => {
    if (formData.featuredImg?.preview) {
      URL.revokeObjectURL(formData.featuredImg.preview);
    }
    setFormData(prev => ({ ...prev, featuredImg: null }));
  };

  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.src = "/placeholder.jpg";
  };

  const VariantImageUploader = ({ variantIndex, images, onUpload, onRemove }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (acceptedFiles) => onUpload(variantIndex, acceptedFiles),
      accept: { 'image/*': [] },
      maxFiles: 7 - images.length
    });

    return (
      <div className="space-y-2">
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer">
          <input {...getInputProps()} />
          <p className="text-gray-500">Drag & drop images here, or click to select</p>
          <p className="text-xs text-gray-400">({images.length}/7 images)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((img, imgIndex) => (
            <div key={imgIndex} className="relative group">
              <img 
                src={img.preview} 
                alt={`Variant ${variantIndex + 1} preview ${imgIndex + 1}`}
                className="w-full h-24 object-cover rounded border"
                onError={handleImageError}
              />
              <button
                type="button"
                onClick={() => onRemove(variantIndex, imgIndex)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const FeaturedImageUploader = ({ featuredImg, onUpload, onRemove }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: onUpload,
      accept: { 'image/*': [] },
      maxFiles: 1
    });

    return (
      <div className="space-y-2">
        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded p-4 text-center cursor-pointer">
          <input {...getInputProps()} />
          {featuredImg ? (
            <div className="relative">
              <img 
                src={featuredImg.preview} 
                alt="Featured preview"
                className="w-full h-48 object-contain mx-auto"
                onError={handleImageError}
              />
            </div>
          ) : (
            <p className="text-gray-500">Drag & drop featured image here, or click to select</p>
          )}
        </div>

        {featuredImg && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-2 text-red-500 text-xs sm:text-md"
          >
            Remove Featured Image
          </button>
        )}
      </div>
    );
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name || !formData.price || !formData.gender) {
      toast.error("Name, price, and gender are required");
      setLoading(false);
      return;
    }

    for (const [index, variant] of formData.variants.entries()) {
      if (!variant.color) {
        toast.error(`Variant ${index + 1} must have a color`);
        setLoading(false);
        return;
      }
      if (variant.images.length < 2) {
        toast.error(`Variant ${index + 1} must have at least 2 images`);
        setLoading(false);
        return;
      }
      for (const [sIndex, size] of variant.sizes.entries()) {
        if (!size.size) {
          toast.error(`Variant ${index + 1}, Size ${sIndex + 1} must have a size value`);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const formDataToSend = new FormData();

      // Append basic fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("productDetails", formData.productDetails);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("discountPercentage", formData.discountPercentage);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("model", formData.model);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("activityType", formData.activityType);
      formDataToSend.append("sportType", formData.sportType);
      formDataToSend.append("isFeatured", formData.isFeatured);
      formDataToSend.append("isTrending", formData.isTrending);
      formDataToSend.append("metaTitle", formData.metaTitle);
      formDataToSend.append("metaDescription", formData.metaDescription);
      formDataToSend.append("videoUrl", formData.videoUrl);

      // Featured image
      if (formData.featuredImg?.file) {
        formDataToSend.append("featuredImg", formData.featuredImg.file);
      }

      // Tags and badges
      formDataToSend.append("tags", JSON.stringify(formData.tags));
      formDataToSend.append("badges", JSON.stringify(formData.badges));

      // Prepare variants data - MATCHES UPDATE PRODUCT STRUCTURE
      const variantsData = formData.variants.map(variant => ({
        color: variant.color,
        sizes: variant.sizes,
        images: variant.images.map(img => ({
          filename: img.name,
          isNew: true
        }))
      }));
      formDataToSend.append("variants", JSON.stringify(variantsData));

      // Append variant images with proper field names
      formData.variants.forEach((variant, vIndex) => {
        variant.images.forEach(img => {
          if (img.isNew) {
            formDataToSend.append(`variant_${vIndex}_images`, img.file);
          }
        });
      });

      // Submit to backend
      const response = await axios.post(`${backendUrl}/api/products`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product created successfully!");
      setFormData(initialFormState);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      console.error("Error creating product:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          "Failed to create product";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for size options
  const isShoesCategory = (category) => {
    const lowerCategory = (category || "").toLowerCase();
    return lowerCategory.includes("shoe") || lowerCategory.includes("footwear");
  };

  const isClothingCategory = (category) => {
    const lowerCategory = (category || "").toLowerCase();
    return lowerCategory.includes("cloth") || lowerCategory.includes("apparel");
  };

  const getSizeOptions = (category) => {
    if (isShoesCategory(category)) return SHOE_SIZES;
    if (isClothingCategory(category)) return CLOTHING_SIZES;
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button Container */}
      <div className="fixed bg-white p-2 w-full shadow flex items-center z-10">
        <button
          onClick={() => navigate('/admin#products')}
          className="px-3 py-1 sm:px-4 sm:py-2 border border-black rounded hover:bg-gray-200 transition sm:w-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4 transition-transform duration-300 rotate-180"
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
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Basic Information Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs sm:text-xs sm:text-md font-medium mb-1">Product Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              
              {/* Price */}
              <div>
                <label className="block text-xs sm:text-xs sm:text-md font-medium mb-1">Price*</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              {/* Discount */}
              <div>
                <label className="block text-xs sm:text-xs sm:text-md font-medium mb-1">Discount Percentage</label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  min="0"
                  max="100"
                />
                {formData.finalPrice && (
                  <p className="text-xs sm:text-xs sm:text-md text-green-600 mt-1">
                    Final Price: ₹{formData.finalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              
              {/* Product Details */}
              <div>
                <label className="block text-xs sm:text-xs sm:text-md font-medium mb-1">Product Details</label>
                <textarea
                  type="text"
                  name="productDetails"
                  value={formData.productDetails}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              
              {/* Gender */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Gender*</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
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
                <label className="block text-xs sm:text-md font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              
              {/* Model */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Activity Type</label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sport Type */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Sport Type</label>
                <select
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  {SPORT_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
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
                    className="mr-2"
                  />
                  <span className="text-xs sm:text-md">Featured</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-xs sm:text-md">Trending</span>
                </label>
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-4">
              <label className="block text-xs sm:text-md font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                rows="4"
              />
            </div>
          </div>

          {/* Featured Image Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Featured Image</h2>
            <FeaturedImageUploader
              featuredImg={formData.featuredImg}
              onUpload={handleFeaturedImageUpload}
              onRemove={removeFeaturedImage}
            />
          </div>

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Product Variants</h2>
            
            {formData.variants.map((variant, variantIndex) => (
              <div key={variantIndex} className="mb-8 border-b pb-6 last:border-b-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Variant {variantIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-md"
                    disabled={formData.variants.length <= 1}
                  >
                    Remove Variant
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Color */}
                  <div>
                    <label className="block text-xs sm:text-md font-medium mb-1">Color*</label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(variantIndex, "color", e.target.value)}
                      className="w-full border p-2 rounded"
                      required
                    />
                  </div>
                  
                  {/* Images */}
                  <div>
                    <label className="block text-xs sm:text-md font-medium mb-1">
                      Images* (Minimum 2 required)
                    </label>
                    <VariantImageUploader
                      variantIndex={variantIndex}
                      images={variant.images}
                      onUpload={handleVariantImageUpload}
                      onRemove={removeVariantImage}
                    />
                  </div>
                </div>
                
                {/* Sizes */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs sm:text-md font-medium">Sizes & Stock*</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addSize(variantIndex)}
                        className="text-blue-500 hover:text-blue-700 text-xs sm:text-md"
                      >
                        + Add Size
                      </button>
                      {(isShoesCategory(formData.category) || isClothingCategory(formData.category)) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isShoesCategory(formData.category)) {
                              autoFillSizes(SHOE_SIZES);
                            } else if (isClothingCategory(formData.category)) {
                              autoFillSizes(CLOTHING_SIZES);
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs sm:text-md"
                        >
                          Reset to Default Sizes
                        </button>
                      )}
                    </div>
                  </div>

                  {variant.sizes.map((size, sizeIndex) => (
                    <div key={sizeIndex} className="grid grid-cols-3 gap-3 mb-3">
                      {/* Size Selector */}
                      {(isShoesCategory(formData.category) || isClothingCategory(formData.category)) ? (
                        <select
                          value={size.size}
                          onChange={(e) => handleSizeChange(variantIndex, sizeIndex, "size", e.target.value)}
                          className="border p-2 rounded"
                          required
                        >
                          <option value="">Select Size</option>
                          {getSizeOptions(formData.category).map((sizeOption, i) => (
                            <option key={i} value={sizeOption}>{sizeOption}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Size (e.g., S, M, L)"
                          value={size.size}
                          onChange={(e) => handleSizeChange(variantIndex, sizeIndex, "size", e.target.value)}
                          className="border p-2 rounded"
                          required
                        />
                      )}
                      
                      <input
                        type="number"
                        placeholder="Stock"
                        value={size.stock}
                        onChange={(e) => handleSizeChange(variantIndex, sizeIndex, "stock", e.target.value)}
                        className="border p-2 rounded"
                        min="0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(variantIndex, sizeIndex)}
                        className="text-red-500 hover:text-red-700 text-xs sm:text-md"
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
              className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-xs sm:text-md"
            >
              + Add Another Variant
            </button>
          </div>

          {/* SEO & Marketing Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">SEO & Marketing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Title */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              
              {/* Meta Description */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Meta Description</label>
                <input
                  type="text"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(tag => tag);
                    setFormData({ ...formData, tags });
                  }}
                  className="w-full border p-2 rounded"
                  placeholder="running, casual, limited"
                />
              </div>
              
              {/* Badges */}
              <div>
                <label className="block text-xs sm:text-md font-medium mb-1">Badges</label>
                <input
                  type="text"
                  name="badges"
                  value={formData.badges.join(", ")}
                  onChange={(e) => {
                    const badges = e.target.value.split(",").map(badge => badge.trim());
                    setFormData({ ...formData, badges });
                  }}
                  className="w-full border p-2 rounded"
                  placeholder="New, Limited, Hot"
                />
              </div>
              
              {/* Video URL */}
              <div className="md:col-span-2">
                <label className="block text-xs sm:text-md font-medium mb-1">Video URL</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="https://youtube.com/embed/..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin#products')}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;