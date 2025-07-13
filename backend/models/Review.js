const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    images: {
      type: [String], // array of URLs (can be uploaded to Cloudinary, etc.)
      default: [],
    },
  },
  { timestamps: true }
);
// review.model.js

reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        numReviews: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const Product = mongoose.model("Product");

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats[0].avgRating.toFixed(1),
      numReviews: stats[0].numReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      numReviews: 0,
    });
  }
};
// After saving a review
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

// When a review is deleted via `review.remove()`
reviewSchema.post("remove", function () {
  this.constructor.calcAverageRatings(this.product);
});
// For update and delete operations
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.reviewDoc = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.reviewDoc) {
    await this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
