const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');


exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        select: 'name price slug discountPercentage finalPrice gender variants images', // Include all needed fields
        populate: {
          path: 'variants',
          select: 'images color sizes' // Include variant images and sizes
        }
      });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Transform data to include first available image and clean up structure
    const enhancedProducts = wishlist.products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      finalPrice: product.finalPrice,
      discountPercentage: product.discountPercentage,
      slug: product.slug,
      gender: product.gender,
      // Get first available image in this order: product image -> first variant image -> placeholder
      mainImage: product.images?.[0] || 
                product.variants?.[0]?.images?.[0] ||
                '/placeholder.jpg',
      // Include all variants if needed
      variants: product.variants.map(variant => ({
        color: variant.color,
        sizes: variant.sizes,
        images: variant.images
      }))
    }));

    res.status(200).json({
      success: true,
      count: enhancedProducts.length,
      data: enhancedProducts
    });

  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist'
    });
  }
};
   
// POST /api/wishlist   { productId }
exports.toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  // Basic validation
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid productId is required'
    });
  }

  try {
    // Ensure the product exists
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Atomic toggle: addToSet if not present, pull if present
    const update = {};
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const inWishlist = wishlist?.products.some(id => id.equals(productId));

    if (inWishlist) {
      update.$pull = { products: productId };
    } else {
      update.$addToSet = { products: productId };
    }

    const updated = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      update,
      {
        new: true, 
        upsert: true,        // create wishlist doc if none exists
        projection: { products: 1 }
      }
    ).populate('products', 'name price slug images');

    return res.status(200).json({
      success: true,
      action: inWishlist ? 'removed' : 'added',
      wishlist: updated.products
    });
  } catch (err) {
    console.error('Toggle wishlist error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update wishlist'
    });
  }
};

