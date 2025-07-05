const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify")
const multer = require('multer');


// @desc    Create a new product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      productDetails,
      price,
      description,
      category,
      model,
      gender,
      activityType,
      sportType,
      isFeatured,
      isTrending,
      variants,
      metaTitle,
      metaDescription,
      tags,
      badges,
      videoUrl,
      discountPercentage,
    } = req.body;

    // Basic validations
    if (!name?.trim()) return res.status(400).json({ error: "Product name is required" });
    if (isNaN(price)) return res.status(400).json({ error: "Valid price is required" });
    if (!["men", "women", "kids", "unisex"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    const slug = slugify(name, { lower: true, strict: true });
    let parsedVariants = [];
    try {
      parsedVariants = variants ? JSON.parse(variants) : [];
    } catch (err) {
      return res.status(400).json({ error: "Invalid variants format" });
    }

    // Helper to get relative path
    const getRelPath = (filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // --- Handle variant images ---
    const variantImagesMap = {};
    (req.files || []).forEach(file => {
      const match = file.fieldname.match(/^variant_(\d+)_images$/);
      if (match) {
        const index = parseInt(match[1]);
        if (!variantImagesMap[index]) {
          variantImagesMap[index] = [];
        }
        variantImagesMap[index].push(getRelPath(file.path));
      }
    });

    // --- Handle featured image ---
    const newFeaturedImg = req.files?.featuredImg?.[0];

    // --- Process variants ---
    const processedVariants = parsedVariants.map((variant, index) => {
      if (!variant.color || !variant.color.trim()) {
        throw new Error(`Variant at position ${index} must have a color`);
      }

      const newImages = variantImagesMap[index] || [];

      if (newImages.length < 2) {
        throw new Error(`Variant "${variant.color}" must have at least 2 images`);
      }

      const processedSizes = (variant.sizes || []).map((size, sizeIndex) => {
        if (!size.size) {
          throw new Error(`Variant "${variant.color}", size ${sizeIndex + 1} must have a size value`);
        }
        return {
          size: String(size.size),
          stock: Math.max(0, parseInt(size.stock) || 0)
        };
      });

      return {
        color: variant.color.trim(),
        images: newImages,
        sizes: processedSizes
      };
    });

    // --- Price and discount ---
    const numericPrice = parseFloat(price);
    const discount = discountPercentage
      ? Math.min(100, Math.max(0, parseFloat(discountPercentage)))
      : 0;
    const finalPrice = Math.round(numericPrice * (100 - discount) / 100);

    // --- Parse tags & badges ---
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
    const parsedBadges = badges ? (typeof badges === 'string' ? JSON.parse(badges) : badges) : [];

    const product = await Product.create({
      name: name.trim(),
      slug,
      productDetails: productDetails?.trim() || "",
      price: numericPrice,
      discountPercentage: discount,
      finalPrice,
      description: description?.trim() || "",
      category: category?.trim() || "",
      model: model?.trim() || "",
      gender,
      activityType: activityType || 'casual',
      sportType: sportType || 'other',
      isFeatured: ["true", true, "1", 1].includes(isFeatured),
      isTrending: ["true", true, "1", 1].includes(isTrending),
      featuredImg: newFeaturedImg ? getRelPath(newFeaturedImg.path) : null,
      metaTitle: metaTitle?.trim() || "",
      metaDescription: metaDescription?.trim() || "",
      tags: parsedTags,
      badges: parsedBadges,
      videoUrl: videoUrl?.trim() || "",
      variants: processedVariants
    });

    res.status(201).json({
      success: true,
      product
    });

  } catch (err) {
    console.error("Error creating product:", err);

    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file.path) {
          fs.unlink(file.path, () => {});
        }
      });
    }

    res.status(err.name === "ValidationError" ? 422 : 400).json({
      error: err.message || "Failed to create product",
      ...(err.errors && { details: err.errors })
    });
  }
};
// @desc    Get all products (filter by category or gender)
// @route   GET /api/products
exports.getAllProducts = async (req, res) => {
  console.log("Received query:", req.query);

  try {
    const query = {};

    // Filter by category, model, gender
    if (req.query.category) query.category = req.query.category;
    if (req.query.model) query.model = req.query.model;
    if (req.query.gender) query.gender = req.query.gender;
    
    // Filter by activity and sport types
    if (req.query.activityType) query.activityType = req.query.activityType;
    if (req.query.sportType) query.sportType = req.query.sportType;

    // Boolean filters
    if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === 'true';
    if (req.query.isTrending) query.isTrending = req.query.isTrending === 'true';

    // Filter by tags (match any tag)
    if (req.query.tags) {
      const tagsArray = req.query.tags.split(",");
      query.tags = { $in: tagsArray };
    }

    // Filter by badges (match any badge)
    if (req.query.badges) {
      const badgesArray = req.query.badges.split(",");
      query.badges = { $in: badgesArray };
    }

    // Filter by rating
    if (req.query.minRating) {
      query.rating = { $gte: Number(req.query.minRating) };
    }

    // Price or finalPrice filter
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    // Filter by discountPercentage
    if (req.query.minDiscount) {
      query.discountPercentage = { $gte: Number(req.query.minDiscount) };
    }

    // Filter by releaseDate (New Arrivals)
    if (req.query.newArrival === 'true') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.releaseDate = { $gte: oneMonthAgo };
    }

    // Filter by color
    if (req.query.color) {
      query["variants.color"] = { $regex: new RegExp(`^${req.query.color}$`, 'i') };
    }

    if (req.query.size) {
      query["variants.sizes"] = {
        $elemMatch: { size: req.query.size }
      };
    }

    // Search by name
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    let sortOption = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy === 'sold') sortOption = { sold: -1 };
    if (req.query.sortBy === 'priceAsc') sortOption = { finalPrice: 1 };
    if (req.query.sortBy === 'priceDesc') sortOption = { finalPrice: -1 };

    const allProducts = await Product.find(query).sort(sortOption).lean();

    // Filter finalPrice or price in JS
    const filtered = allProducts.filter((product) => {
      const priceToUse = product.finalPrice || product.price;
      return priceToUse >= minPrice && priceToUse <= maxPrice;
    });

    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get a product by slug
// @route   GET /api/products/:slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name')
      .populate('tags', 'name');

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Format image paths for frontend
    const formatImages = (imgPath) => {
      if (!imgPath) return null;
      return imgPath.replace(/\\/g, '/');
    };

    const formattedProduct = {
      ...product.toObject(),
      featuredImg: formatImages(product.featuredImg),
      variants: product.variants.map(variant => ({
        ...variant.toObject(),
        images: variant.images.map(formatImages).filter(Boolean),
        sizes: variant.sizes || [] // Ensure sizes array exists
      })),
      meta: {
        title: product.metaTitle,
        description: product.metaDescription,
        productDetails:product.productDetails
      }
    };

    // Only increment views if not an admin request
    if (!req.headers['admin-request']) {
      product.views += 1;
      await product.save();
    }

    res.json(formattedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// @desc    Get a product by ID
// @route   GET /api/products/id/:id
// @route   GET /api/products/id/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const formatImages = (imgPath) => {
      if (!imgPath) return null;
      return imgPath.replace(/\\/g, '/');
    };

    const productObj = product.toObject();

    // Extract featured image and variant images
    const formattedResponse = {
      productId: product._id,
      featuredImg: formatImages(product.featuredImg),
      variants: productObj.variants?.map(variant => ({
        _id: variant._id,
        images: (variant.images || []).map(formatImages).filter(Boolean)
      })) || []
    };

    res.json(formattedResponse);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.kind === 'ObjectId' ? 'Invalid product ID format' : undefined
    });
  }
};



// @desc    Update a product
// @route   PUT /api/products/:
exports.updateProduct = async (req, res) => {
  console.log('Update request received:', {
    body: req.body,
    files: req.files,
    params: req.params
  });

  try {
    const {
      name,
      productDetails,
      price,
      description,
      category,
      model,
      gender,
      activityType,
      sportType,
      isFeatured,
      isTrending,
      variants,
      metaTitle,
      metaDescription,
      tags,
      badges,
      videoUrl,
      discountPercentage,
      removeFeaturedImg
    } = req.body;

    const existingProduct = await Product.findOne({ slug: req.params.slug });
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (name && !name.trim()) {
      return res.status(400).json({ error: "Product name cannot be empty" });
    }

    if (gender && !["men", "women", "kids", "unisex"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    // Helper: Convert file path to relative
    const getRelPath = (filePath) => path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    // --- Handle variant images ---
    const variantImagesMap = {};
    (req.files || []).forEach(file => {
      const match = file.fieldname.match(/^variant_(\d+)_images$/);
      if (match) {
        const index = parseInt(match[1]);
        if (!variantImagesMap[index]) {
          variantImagesMap[index] = [];
        }
        variantImagesMap[index].push(getRelPath(file.path));
      }
    });

    // --- Parse variants ---
    let parsedVariants = [];
    try {
      parsedVariants = variants ? JSON.parse(variants) : existingProduct.variants;
    } catch (err) {
      return res.status(400).json({ error: "Invalid variants format" });
    }

    // --- Handle featured image ---
    const newFeaturedImg = req.files?.featuredImg?.[0];
    let featuredImg = existingProduct.featuredImg;

    if (removeFeaturedImg === "true") {
      featuredImg = null;
    } else if (newFeaturedImg) {
      featuredImg = getRelPath(newFeaturedImg.path);
    }

    // --- Delete removed variant images ---
    parsedVariants.forEach(variant => {
      const removedImages = variant.imagesToRemove || [];
      removedImages.forEach(url => {
        const filePath = path.join(process.cwd(), url);
        fs.unlink(filePath, err => {
          if (err) {
            console.warn("Failed to delete file:", filePath);
          } else {
            console.log("Deleted old variant image:", filePath);
          }
        });
      });
    });

    // --- Process variants ---
    const processedVariants = parsedVariants.map((variant, index) => {
      const existingImages = variant.images
        ?.filter(img => img.isExisting)
        .map(img => img.url)
        .filter(url => !variant.imagesToRemove?.includes(url)) || [];

      const newImages = variantImagesMap[index] || [];

      const combinedImages = [...existingImages, ...newImages];

      if (combinedImages.length < 2) {
        throw new Error(`Variant "${variant.color}" must have at least 2 images`);
      }

      return {
        color: variant.color,
        images: combinedImages,
        sizes: variant.sizes?.map(size => ({
          size: String(size.size),
          stock: Math.max(0, parseInt(size.stock) || 0)
        })) || []
      };
    });

    // --- Price and discount ---
    const numericPrice = price ? parseFloat(price) : existingProduct.price;
    const discount = discountPercentage
      ? Math.min(100, Math.max(0, parseFloat(discountPercentage)))
      : existingProduct.discountPercentage || 0;
    const finalPrice = Math.round(numericPrice * (100 - discount) / 100);

    // --- Parse tags & badges ---
    const parsedTags = tags
      ? (typeof tags === 'string' ? JSON.parse(tags) : tags)
      : existingProduct.tags;
    const parsedBadges = badges
      ? (typeof badges === 'string' ? JSON.parse(badges) : badges)
      : existingProduct.badges;

    // --- Update product fields ---
    existingProduct.set({
      name: name?.trim() || existingProduct.name,
      productDetails: productDetails?.trim() || existingProduct.productDetails,
      price: numericPrice,
      discountPercentage: discount,
      finalPrice,
      description: description?.trim() || existingProduct.description,
      category: category?.trim() || existingProduct.category,
      model: model?.trim() || existingProduct.model,
      gender: gender || existingProduct.gender,
      activityType: activityType || existingProduct.activityType,
      sportType: sportType || existingProduct.sportType,
      isFeatured: ["true", true, "1", 1].includes(isFeatured)
        ? true
        : isFeatured === undefined
        ? existingProduct.isFeatured
        : false,
      isTrending: ["true", true, "1", 1].includes(isTrending)
        ? true
        : isTrending === undefined
        ? existingProduct.isTrending
        : false,
      featuredImg,
      metaTitle: metaTitle?.trim() || existingProduct.metaTitle,
      metaDescription: metaDescription?.trim() || existingProduct.metaDescription,
      tags: parsedTags,
      badges: parsedBadges,
      videoUrl: videoUrl?.trim() || existingProduct.videoUrl,
      variants: processedVariants
    });

    const updatedProduct = await existingProduct.save();

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (err) {
    console.error("Error updating product:", err);

    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (file.path) {
          fs.unlink(file.path, () => {});
        }
      });
    }

    res.status(err.name === "ValidationError" ? 422 : 400).json({
      error: err.message || "Failed to update product",
      ...(err.errors && { details: err.errors })
    });
  }
};


// @desc    Delete a product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.featuredImg && fs.existsSync(product.featuredImg)) {
      fs.unlinkSync(product.featuredImg);
    }

    product.variants.forEach((variant) => {
      variant.images.forEach((imgPath) => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get top-selling products
// @route   GET /api/products/top
exports.getTopSellingProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ sold: -1 }).limit(10);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Increment wishlist count
// @route PATCH /api/products/:id/wishlist
exports.incrementWishlistCount = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { wishlistCount: 1 } },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Increment addToBag count
// @route PATCH /api/products/:id/addToBag
exports.incrementAddToBagCount = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { addToBagCount: 1 } },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const genders = await Product.distinct("gender");
    const models = await Product.distinct("model");
    const activityTypes = await Product.distinct("activityType");
    const sportTypes = await Product.distinct("sportType");
    const colors = await Product.distinct("variants.color");
    const sizes = await Product.distinct("variants.sizes.size");

    // Build sizesByCategory dynamically from product variants
    const products = await Product.find({}, "category variants.sizes.size");

    const sizesByCategory = {};

    products.forEach((product) => {
      const cat = product.category;
      const productSizes = product.variants?.flatMap(variant =>
        variant.sizes?.map(sizeObj => sizeObj.size)
      ) || [];

      if (!sizesByCategory[cat]) {
        sizesByCategory[cat] = new Set();
      }

      productSizes.forEach((size) => {
        if (size) sizesByCategory[cat].add(size);
      });
    });

    // Convert Sets to Arrays
    const sizesByCategoryObj = {};
    for (let cat in sizesByCategory) {
      sizesByCategoryObj[cat] = Array.from(sizesByCategory[cat]);
    }

    res.json({
      categories,
      genders,
      models,
      activityTypes,
      sportTypes,
      colors,
      sizes,
      sizesByCategory: sizesByCategoryObj,
    });
  } catch (err) {
    console.error("Failed to fetch filter options:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};