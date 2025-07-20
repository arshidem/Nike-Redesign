const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const multer = require("multer");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Review = require("../models/Review");
const mongoose = require("mongoose");
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
    if (!name?.trim())
      return res.status(400).json({ error: "Product name is required" });
    if (isNaN(price))
      return res.status(400).json({ error: "Valid price is required" });
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
    const getRelPath = (filePath) =>
      path.relative(process.cwd(), filePath).replace(/\\/g, "/");

    // --- Handle variant images ---
    const variantImagesMap = {};
    (req.files || []).forEach((file) => {
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
        throw new Error(
          `Variant "${variant.color}" must have at least 2 images`
        );
      }

      const processedSizes = (variant.sizes || []).map((size, sizeIndex) => {
        if (!size.size) {
          throw new Error(
            `Variant "${variant.color}", size ${
              sizeIndex + 1
            } must have a size value`
          );
        }
        return {
          size: String(size.size),
          stock: Math.max(0, parseInt(size.stock) || 0),
        };
      });

      return {
        color: variant.color.trim(),
        images: newImages,
        sizes: processedSizes,
      };
    });

    // --- Price and discount ---
    const numericPrice = parseFloat(price);
    const discount = discountPercentage
      ? Math.min(100, Math.max(0, parseFloat(discountPercentage)))
      : 0;
    const finalPrice = Math.round((numericPrice * (100 - discount)) / 100);

    // --- Parse tags & badges ---
    const parsedTags = tags
      ? typeof tags === "string"
        ? JSON.parse(tags)
        : tags
      : [];
    const parsedBadges = badges
      ? typeof badges === "string"
        ? JSON.parse(badges)
        : badges
      : [];

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
      activityType: activityType || "casual",
      sportType: sportType || "other",
      isFeatured: ["true", true, "1", 1].includes(isFeatured),
      isTrending: ["true", true, "1", 1].includes(isTrending),
      featuredImg: newFeaturedImg ? getRelPath(newFeaturedImg.path) : null,
      metaTitle: metaTitle?.trim() || "",
      metaDescription: metaDescription?.trim() || "",
      tags: parsedTags,
      badges: parsedBadges,
      videoUrl: videoUrl?.trim() || "",
      variants: processedVariants,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    console.error("Error creating product:", err);

    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (file.path) {
            fs.unlink(file.path, () => {});
          }
        });
    }

    res.status(err.name === "ValidationError" ? 422 : 400).json({
      error: err.message || "Failed to create product",
      ...(err.errors && { details: err.errors }),
    });
  }
};
// @desc    Get all products (filter by category or gender)
// @route   GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const query = {};

    // Basic filters
    if (req.query.category) query.category = req.query.category;
    if (req.query.model) query.model = req.query.model;
    if (req.query.gender) query.gender = req.query.gender;
    if (req.query.activityType) query.activityType = req.query.activityType;
    if (req.query.sportType) query.sportType = req.query.sportType;
    if (req.query.isFeatured)
      query.isFeatured = req.query.isFeatured === "true";
    if (req.query.isTrending)
      query.isTrending = req.query.isTrending === "true";
    if (req.query.tags) query.tags = { $in: req.query.tags.split(",") };
    if (req.query.badges) query.badges = { $in: req.query.badges.split(",") };
    if (req.query.minDiscount)
      query.discountPercentage = { $gte: Number(req.query.minDiscount) };
    if (req.query.newArrival === "true") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query.releaseDate = { $gte: oneMonthAgo };
    }
 if (req.query.lastChance === 'true') {
  query.discountPercentage = { $gte: 40 }; // Only filter by high discount
}

    if (req.query.color) {
      query["variants.color"] = {
        $regex: new RegExp(`^${req.query.color}$`, "i"),
      };
    }
    if (req.query.size) {
      query["variants.sizes"] = { $elemMatch: { size: req.query.size } };
    }
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    // Price range
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
    query.$expr = {
      $and: [
        { $gte: [{ $ifNull: ["$finalPrice", "$price"] }, minPrice] },
        { $lte: [{ $ifNull: ["$finalPrice", "$price"] }, maxPrice] },
      ],
    };

    let sortOption = { createdAt: -1 };
let bestSellerIds = null;
if (req.query.bestSellers === "true") {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const orders = await Order.find({ createdAt: { $gte: oneMonthAgo } })
    .select("items")
    .lean();

  const salesMap = {};
  for (const order of orders) {
    for (const item of order.items) {
      const id = item.product.toString();
      salesMap[id] = (salesMap[id] || 0) + item.quantity;
    }
  }

  bestSellerIds = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id]) => id);

  query._id = { $in: bestSellerIds };
}

// 🎯 Optional: Handle discount filter as well
if (req.query.minDiscount) {
  query.discount = { $gte: Number(req.query.minDiscount) };
}


    // Sorting
    if (req.query.sortBy === "sold") sortOption = { sold: -1 };
    if (req.query.sortBy === "priceAsc") sortOption = { finalPrice: 1 };
    if (req.query.sortBy === "priceDesc") sortOption = { finalPrice: -1 };

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await Product.countDocuments(query);
    let products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalItems / limit);

    // Enrich with ratings
    const productIds = products.map((p) => p._id);
    const ratingStats = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = {};
    ratingStats.forEach((stat) => {
      ratingMap[stat._id.toString()] = {
        average: Number(stat.averageRating?.toFixed(1) || 0),
        total: stat.numReviews,
      };
    });

    // Add ratings to products
    let enrichedProducts = products.map((product) => {
      const rating = ratingMap[product._id.toString()] || {
        average: 0,
        total: 0,
      };
      return { ...product, rating };
    });

    // Filter by rating
    if (req.query.minRating) {
      const min = Number(req.query.minRating);
      enrichedProducts = enrichedProducts.filter(
        (p) => p.rating.average >= min
      );
    }

    // Preserve order of best sellers
    if (req.query.bestSellers === "true" && bestSellerIds) {
      enrichedProducts.sort(
        (a, b) =>
          bestSellerIds.indexOf(a._id.toString()) -
          bestSellerIds.indexOf(b._id.toString())
      );
    }

    res.json({
      success: true,
      products: enrichedProducts,
      pagination: {
        totalItems: enrichedProducts.length,
        totalPages,
        currentPage: page,
      },
    });
  } catch (err) {
    console.error("Error in getAllProducts:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// @desc    Search products
// @route   GET /api/products/search
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'variants.color': { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    };

    // Apply similar filters as getAllProducts if needed
    if (req.query.gender) searchQuery.gender = req.query.gender;
    if (req.query.category) searchQuery.category = req.query.category;

    // Get products with basic fields needed for search results
    const products = await Product.find(searchQuery)
      .select('name slug price finalPrice discountPercentage variants.images variants.color')
      .limit(10) // Limit results for better performance
      .lean();

    // Format results for frontend
    const results = products.map(product => ({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      finalPrice: product.finalPrice,
      discountPercentage: product.discountPercentage,
      // Get first available image
      image: product.variants?.[0]?.images?.[0],
      // Get available colors
      colors: [...new Set(product.variants.map(v => v.color))]
    }));

    res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category", "name")
      .populate("tags", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productId = product._id;

    // 📦 Sold Timeline & Total Sold (from Order)
    const soldTimelineAgg = await Order.aggregate([
      { $unwind: "$items" },
      {
        $match: {
          "items.product": new mongoose.Types.ObjectId(productId),
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          date: "$_id.date",
          unitsSold: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    const totalSold = soldTimelineAgg.reduce((sum, d) => sum + d.unitsSold, 0);

    // 🛒 Cart Stats (from Cart)
    const cartStats = await Cart.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$items" },
      {
        $match: {
          "items.productId": new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: null,
          totalCartQuantity: { $sum: "$items.quantity" },
          inCartCount: { $sum: 1 },
        },
      },
    ]);

    const totalCartQuantity = cartStats[0]?.totalCartQuantity || 0;
    const inCartCount = cartStats[0]?.inCartCount || 0;

    // ⭐️ Rating Stats from Review model
    const ratingStats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingInfo = ratingStats[0] || { averageRating: 0, numReviews: 0 };

    // 🖼️ Format image paths
    const formatImages = (imgPath) => imgPath?.replace(/\\/g, "/");

    const formattedProduct = {
      ...product.toObject(),
      featuredImg: formatImages(product.featuredImg),
      variants: product.variants.map((variant) => ({
        ...variant.toObject(),
        images: variant.images.map(formatImages).filter(Boolean),
        sizes: variant.sizes || [],
      })),
      meta: {
        title: product.metaTitle,
        description: product.metaDescription,
        productDetails: product.productDetails,
      },
      rating: {
        average: Number(ratingInfo.averageRating?.toFixed(1) || 0),
        total: ratingInfo.numReviews || 0,
      },
      statistics: {
        views: product.views,
        sold: totalSold,
        wishlist: product.wishlistCount,
        inCart: inCartCount,
        totalInCart: totalCartQuantity,
      },
      timelineSummary: {
        soldTimeline: soldTimelineAgg.slice(-14),
      },
    };

    // 📈 Increment views unless it's admin
    if (!req.headers["admin-request"]) {
      product.views += 1;
      await product.save();
    }

    res.json(formattedProduct);
  } catch (err) {
    console.error("❌ getProductBySlug error:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get a product by ID
// @route   GET /api/products/id/:id
// @route   GET /api/products/id/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const formatImages = (imgPath) => {
      if (!imgPath) return null;
      return imgPath.replace(/\\/g, "/");
    };

    const productObj = product.toObject();

    // Extract featured image and variant images
    const formattedResponse = {
      productId: product._id,
      featuredImg: formatImages(product.featuredImg),
      variants:
        productObj.variants?.map((variant) => ({
          _id: variant._id,
          images: (variant.images || []).map(formatImages).filter(Boolean),
        })) || [],
    };

    res.json(formattedResponse);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details:
        err.kind === "ObjectId" ? "Invalid product ID format" : undefined,
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:
// @desc    Update a product
// @route   PUT /api/products/:slug
// @desc    Update a product
// @route   PUT /api/products/:slug
exports.updateProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const existingProduct = await Product.findOne({ slug });
    
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Helper to get relative path
    const getRelPath = (filePath) => 
      path.relative(process.cwd(), filePath).replace(/\\/g, "/");

    // --- Handle featured image ---
    let featuredImg = existingProduct.featuredImg;
    if (req.body.removeFeaturedImg === "true") {
      if (featuredImg) {
        const oldPath = path.join(process.cwd(), featuredImg);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      featuredImg = null;
    } else if (req.files?.featuredImg?.[0]) {
      if (featuredImg) {
        const oldPath = path.join(process.cwd(), featuredImg);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      featuredImg = getRelPath(req.files.featuredImg[0].path);
    }

    // --- Parse variants ---
    let variantsData = [];
    try {
      variantsData = req.body.variants ? JSON.parse(req.body.variants) : existingProduct.variants;
    } catch (err) {
      return res.status(400).json({ error: "Invalid variants format" });
    }

    // --- Handle variant images ---
    const variantImagesMap = {};
    if (req.files) {
      // Convert req.files object to array of files
      const filesArray = Object.entries(req.files)
        .filter(([fieldName]) => fieldName.startsWith('variant_'))
        .flatMap(([_, files]) => files);

      filesArray.forEach((file) => {
        const match = file.fieldname.match(/^variant_(\d+)_images$/);
        if (match) {
          const index = parseInt(match[1]);
          variantImagesMap[index] = variantImagesMap[index] || [];
          variantImagesMap[index].push(getRelPath(file.path));
        }
      });
    }

    // --- Process variants ---
    const processedVariants = variantsData.map((variant, index) => {
      // Handle existing images
      const existingImages = variant.images
        ?.filter(img => img.isExisting)
        ?.map(img => img.url)
        ?.filter(url => !(variant.imagesToRemove || []).includes(url)) || [];

      // Get new uploaded images for this variant
      const newImages = variantImagesMap[index] || [];

      // Combine images
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

    // --- Price calculations ---
    const price = req.body.price ? parseFloat(req.body.price) : existingProduct.price;
    const discountPercentage = req.body.discountPercentage
      ? Math.min(100, Math.max(0, parseFloat(req.body.discountPercentage)))
      : existingProduct.discountPercentage || 0;
    const finalPrice = Math.round(price * (100 - discountPercentage) / 100);

    // --- Clean up removed images ---
    variantsData.forEach(variant => {
      (variant.imagesToRemove || []).forEach(url => {
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

    // Prepare update data
    const updateData = {
      name: req.body.name || existingProduct.name,
      productDetails: req.body.productDetails || existingProduct.productDetails,
      price,
      discountPercentage,
      finalPrice,
      description: req.body.description || existingProduct.description,
      category: req.body.category || existingProduct.category,
      model: req.body.model || existingProduct.model,
      gender: req.body.gender || existingProduct.gender,
      activityType: req.body.activityType || existingProduct.activityType,
      sportType: req.body.sportType || existingProduct.sportType,
      isFeatured: ["true", true, "1", 1].includes(req.body.isFeatured),
      isTrending: ["true", true, "1", 1].includes(req.body.isTrending),
      featuredImg,
      metaTitle: req.body.metaTitle || existingProduct.metaTitle,
      metaDescription: req.body.metaDescription || existingProduct.metaDescription,
      tags: req.body.tags ? JSON.parse(req.body.tags) : existingProduct.tags,
      badges: req.body.badges ? JSON.parse(req.body.badges) : existingProduct.badges,
      videoUrl: req.body.videoUrl || existingProduct.videoUrl,
      variants: processedVariants
    };

    // Update the product
    const updatedProduct = await Product.findOneAndUpdate(
      { slug },
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (err) {
    console.error("Error updating product:", err);
    
    // Clean up uploaded files on error
    if (req.files) {
      const files = Object.values(req.files).flat();
      files.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(400).json({
      error: err.message || "Failed to update product",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
// @desc    Bulk delete products
// @route   DELETE /api/products/bulk-delete
// @access  Private/Admin
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No product IDs provided",
      });
    }

    // 1) Load products with only necessary fields
    const products = await Product.find(
      { _id: { $in: ids } },
      { featuredImg: 1, variants: 1 }
    ).lean();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No matching products found",
      });
    }

    // 2) Safely remove images
    const deleteFile = (path) => {
      try {
        if (path && fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      } catch (fileErr) {
        console.error(`Failed to delete file ${path}:`, fileErr);
      }
    };

    products.forEach((product) => {
      deleteFile(product.featuredImg);
      product.variants?.forEach((variant) => {
        variant.images?.forEach(deleteFile);
      });
    });

    // 3) Delete products and reviews in transaction
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        // Delete products
        result = await Product.deleteMany({ _id: { $in: ids } }, { session });

        // Delete associated reviews - no need to convert to ObjectId
        await Review.deleteMany(
          { product: { $in: ids } }, // Mongoose handles string conversion automatically
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} products deleted`,
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return res.status(500).json({
      success: false,
      error: "Bulk delete failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
// @desc    Get top-selling products
// @route   GET /api/products/top
exports.getTopSellingProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ sold: -1 }).limit(10).lean();
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
    const products = await Product.find(
      {},
      "category variants.sizes.size"
    ).lean();

    const sizesByCategory = {};

    products.forEach((product) => {
      const cat = product.category;
      const productSizes =
        product.variants?.flatMap((variant) =>
          variant.sizes?.map((sizeObj) => sizeObj.size)
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

// @desc   Get all featured products (only name, slug, featuredImg)
// @route  GET /api/products/featured
// @access Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).select(
      "name slug featuredImg"
    );

    res.status(200).json(featuredProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getBestSellers = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const orders = await Order.find({ createdAt: { $gte: oneMonthAgo } })
      .select("items")
      .lean();

    const salesMap = {};

    for (const order of orders) {
      for (const item of order.items) {
        const id = item.product.toString();
        salesMap[id] = (salesMap[id] || 0) + item.quantity;
      }
    }

    const topIds = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const products = await Product.find({ _id: { $in: topIds } })
      .select("name slug price featuredImg")
      .lean();

    const response = products.map((p) => ({
      ...p,
      sold: salesMap[p._id.toString()] || 0,
    }));

    res.json({ success: true, bestSellers: response });
  } catch (err) {
    console.error("Best seller fetch failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get product analytics summary
// @route   GET /api/products/analytics
exports.getProductAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // Define date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const thisYear = new Date();
    thisYear.setFullYear(thisYear.getFullYear() - 1);

    const products = await Product.find()
      .select(
        "name slug variants sold views wishlistCount category gender updatedAt featuredImg sizes"
      )
      .lean();

    // Get all orders to calculate sales by period
    const allOrders = await Order.find().select("items createdAt").lean();

    const analytics = {
      totalProducts: products.length,
      totalVariants: 0,
      totalUnitsSold: {
        allTime: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
      },
      totalViews: 0,
      totalWishlist: 0,
      totalReviews: 0,
      categoryBreakdown: {},
      genderBreakdown: {},
      trendingProducts: {
        today: [],
        thisWeek: [],
        thisMonth: [],
        thisYear: [],
      },
      coldProducts: [],
    };

    const [totalReviews] = await Promise.all([Review.countDocuments()]);

    analytics.totalReviews = totalReviews;

    // Calculate sales by time period from orders
    for (const order of allOrders) {
      const orderDate = new Date(order.createdAt);

      // Count items sold in this order
      const itemsSold = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      analytics.totalUnitsSold.allTime += itemsSold;

      if (orderDate >= today) {
        analytics.totalUnitsSold.today += itemsSold;
      }
      if (orderDate >= thisWeek) {
        analytics.totalUnitsSold.thisWeek += itemsSold;
      }
      if (orderDate >= thisMonth) {
        analytics.totalUnitsSold.thisMonth += itemsSold;
      }
      if (orderDate >= thisYear) {
        analytics.totalUnitsSold.thisYear += itemsSold;
      }
    }

    for (const product of products) {
      analytics.totalVariants += product.variants?.length || 0;
      analytics.totalViews += product.views || 0;
      analytics.totalWishlist += product.wishlistCount || 0;

      const productImage =
        product.featuredImg || product.variants?.[0]?.images?.[0] || null;

      if (product.category) {
        analytics.categoryBreakdown[product.category] =
          (analytics.categoryBreakdown[product.category] || 0) + 1;
      }

      if (product.gender) {
        analytics.genderBreakdown[product.gender] =
          (analytics.genderBreakdown[product.gender] || 0) + 1;
      }

      // Get product-specific orders to calculate time-based sales
      const productOrders = await Order.find({
        "items.product": product._id,
      })
        .select("items createdAt")
        .lean();

      // Calculate sales by period for this product
      const productSales = {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        thisYear: 0,
        allTime: product.sold || 0,
      };

      for (const order of productOrders) {
        const orderDate = new Date(order.createdAt);
        const items = order.items.filter((item) =>
          item.product.equals(product._id)
        );
        const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

        if (orderDate >= today) productSales.today += quantity;
        if (orderDate >= thisWeek) productSales.thisWeek += quantity;
        if (orderDate >= thisMonth) productSales.thisMonth += quantity;
        if (orderDate >= thisYear) productSales.thisYear += quantity;
      }

      // Calculate trend scores for different periods
      const todayScore = productSales.today * 3 + (product.views || 0);
      const weekScore = productSales.thisWeek * 2 + (product.views || 0);
      const monthScore = productSales.thisMonth * 1.5 + (product.views || 0);
      const yearScore = productSales.thisYear * 1 + (product.views || 0);

      // Add to trending products for each period
      if (productSales.today > 0) {
        analytics.trendingProducts.today.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          views: product.views,
          sold: productSales.today,
          trendScore: todayScore,
          image: productImage,
        });
      }

      if (productSales.thisWeek > 0) {
        analytics.trendingProducts.thisWeek.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          views: product.views,
          sold: productSales.thisWeek,
          trendScore: weekScore,
          image: productImage,
        });
      }

      if (productSales.thisMonth > 0) {
        analytics.trendingProducts.thisMonth.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          views: product.views,
          sold: productSales.thisMonth,
          trendScore: monthScore,
          image: productImage,
        });
      }

      if (productSales.thisYear > 0) {
        analytics.trendingProducts.thisYear.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          views: product.views,
          sold: productSales.thisYear,
          trendScore: yearScore,
          image: productImage,
        });
      }

      // Cold products (no sales in last month and low views)
      if (productSales.thisMonth === 0 && productSales.allTime <= 5) {
        analytics.coldProducts.push({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          views: product.views || 0,
          sold: productSales.allTime,
          image: productImage,
          lastSold: product.updatedAt,
        });
      }
    }

    // Sort trending products for each period
    analytics.trendingProducts.today.sort(
      (a, b) => b.trendScore - a.trendScore
    );
    analytics.trendingProducts.thisWeek.sort(
      (a, b) => b.trendScore - a.trendScore
    );
    analytics.trendingProducts.thisMonth.sort(
      (a, b) => b.trendScore - a.trendScore
    );
    analytics.trendingProducts.thisYear.sort(
      (a, b) => b.trendScore - a.trendScore
    );

    // Limit to top 5 for each period
    analytics.trendingProducts.today = analytics.trendingProducts.today.slice(
      0,
      5
    );
    analytics.trendingProducts.thisWeek =
      analytics.trendingProducts.thisWeek.slice(0, 5);
    analytics.trendingProducts.thisMonth =
      analytics.trendingProducts.thisMonth.slice(0, 5);
    analytics.trendingProducts.thisYear =
      analytics.trendingProducts.thisYear.slice(0, 5);

    // Sort cold products
    analytics.coldProducts.sort((a, b) => {
      if (a.sold !== b.sold) {
        return a.sold - b.sold;
      }
      return (a.views || 0) - (b.views || 0);
    });
    analytics.coldProducts = analytics.coldProducts.slice(0, 20);

    // Format category/gender breakdown
    analytics.categoryBreakdown = Object.entries(
      analytics.categoryBreakdown
    ).map(([name, value]) => ({ name, value }));

    analytics.genderBreakdown = Object.entries(analytics.genderBreakdown).map(
      ([gender, count]) => ({ gender, count })
    );

    res.json(analytics);
  } catch (err) {
    console.error("Product analytics error:", err);
    res.status(500).json({
      error: "Failed to generate product analytics",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// controllers/productController.js



exports.getSuggestedProducts = async (req, res) => {
  try {
    const { productSlug } = req.params;

    // Get the main product by slug
    const mainProduct = await Product.findOne({ slug: productSlug });

    if (!mainProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { category, gender, model, _id } = mainProduct;

    const suggestions = await Product.aggregate([
      {
        $match: {
          _id: { $ne: _id }, // exclude the main product itself
          category,
          gender,
        },
      },
      { $sample: { size: 8 } }, // randomly pick 8 from matching ones
    ]);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

