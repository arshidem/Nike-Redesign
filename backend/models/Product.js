const mongoose = require("mongoose");
const slugify = require("slugify");

// Size schema
const SizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
});

// Variant schema
const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  images: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(images) {
        return images.length >= 2 && images.length <= 7;
      },
      message: 'Each variant must have between 2 and 7 images.'
    }
  },
  sizes: [SizeSchema],
});

// Product schema
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productDetails: { type: String },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    price: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    finalPrice: { type: Number },
    description: { type: String },
    category: { type: String },
    model: { type: String },
    gender: {
      type: String,
      enum: ["men", "women", "kids", "unisex"],
      required: true,
    },
    activityType: {
      type: String,
      enum: ["running", "training", "hiking", "walking", "cycling", "sports", "casual", "other"],
      default: "casual"
    },
    sportType: {
      type: String,
      enum: [
        "football", "basketball", "tennis", "cricket", "baseball",
        "golf", "volleyball", "badminton", "table-tennis", "rugby",
        "hockey", "swimming", "athletics", "boxing", "mma",
        "skateboarding", "surfing", "snowboarding", "skiing", "other"
      ],
      default: "other"
    },
    isFeatured: { type: Boolean, default: false },
    featuredImg: { type: String },
    isTrending: { type: Boolean, default: false },
    sold: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    tags: [String],
    badges: [String],
    videoUrl: { type: String },
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    addToBagCount: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
    releaseDate: { type: Date, default: Date.now },
    variants: [VariantSchema],
  },
  { timestamps: true }
);

// Auto-generate slug and calculate final price
ProductSchema.pre("save", function (next) {
if (this.name && this.gender) {
  this.slug = slugify(`${this.name}-${this.gender}`, { lower: true, strict: true });
}


  if (this.discountPercentage > 0) {
    const discountAmount = (this.price * this.discountPercentage) / 100;
    this.finalPrice = Math.round(this.price - discountAmount);
  } else {
    this.finalPrice = this.price;
  }

  next();
});

module.exports = mongoose.model("Product", ProductSchema);