const Review = require("../models/Review");
const Product = require("../models/Product");

// ✅ Helper: Recalculate product stats
const updateProductStats = async (productId) => {
  const reviews = await Review.find({ product: productId });

  const numReviews = reviews.length;
  const averageRating =
    numReviews === 0
      ? 0
      : reviews.reduce((acc, cur) => acc + cur.rating, 0) / numReviews;

  await Product.findByIdAndUpdate(productId, {
    numReviews,
    averageRating: averageRating.toFixed(1),
  });
};

// ✅ Get all reviews for a specific product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// ✅ Add a new review — allowing multiple reviews per product per user
exports.addReview = async (req, res) => {
  try {
    const { product, rating, comment } = req.body;
    const userId = req.user._id;

    // Extract image file paths
    const imageUrls = req.files?.map((file) => `/uploads/${file.filename}`) || [];

    const newReview = await Review.create({
      product,
      user: userId,
      name: req.user.name,
      rating,
      comment,
      images: imageUrls,
    });

    await updateProductStats(product);

    res.status(201).json(newReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add review" });
  }
};


// ✅ Update a review (user only)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (!review.user.equals(userId)) {
      return res.status(403).json({ error: "You can only update your own review" });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    await updateProductStats(review.product);

    res.status(200).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to update review" });
  }
};

// ✅ Delete review (user or admin)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (!isAdmin && !review.user.equals(userId)) {
      return res.status(403).json({ error: "You can only delete your own review" });
    }

    await review.deleteOne();
    await updateProductStats(review.product);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
};

// ✅ (Optional) Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("product", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};
