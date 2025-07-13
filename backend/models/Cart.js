const mongoose = require("mongoose");

// Defer requiring utils to avoid circular dependency
let updateProductCartStats;

// Cart Item Schema
const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  image: String,
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1, min: 1 },
  total: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  gender: { type: String, enum: ["men", "women", "kids", "unisex"] },
  stockAvailable: { type: Boolean, default: true }
});

// Calculate item total before validation
CartItemSchema.pre("validate", function (next) {
  this.total = this.quantity * this.price;
  next();
});

// Virtual for calculated total (if needed)
CartItemSchema.virtual("calculatedTotal").get(function () {
  return this.price * this.quantity;
});

// Main Cart Schema
const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  items: { type: [CartItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 150 },
  tax: { type: Number, default: 0 },
  coupon: {
    code: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    applied: { type: Boolean, default: false }
  },
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["active", "ordered", "abandoned"],
    default: "active"
  }
}, { timestamps: true });

// Recalculate subtotal and total before saving
CartSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  const discount = this.coupon?.applied ? this.coupon.discountAmount : 0;
  this.total = this.subtotal + this.shippingFee + this.tax - discount;
  next();
});

// Virtual total after coupon
CartSchema.virtual("finalTotal").get(function () {
  const discount = this.coupon?.applied ? this.coupon.discountAmount : 0;
  return this.subtotal + this.shippingFee + this.tax - discount;
});

// Hooks to update product cart stats
CartSchema.post("save", async function (doc) {
  if (!updateProductCartStats) updateProductCartStats = require("../utils/updateProductCartStats");
  await updateProductCartStats(doc);
});

CartSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    if (!updateProductCartStats) updateProductCartStats = require("../utils/updateProductCartStats");
    await updateProductCartStats(doc);
  }
});

// Indexes for performance
CartSchema.index({ status: 1 });
CartSchema.index({ "items.productId": 1 });

module.exports = mongoose.model("Cart", CartSchema);
