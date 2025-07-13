const mongoose = require("mongoose");

// Schema for individual items in the order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: String,
  image: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: String,
  color: String,
});

// Schema for shipping address
const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String },
});

// Payment result info (used after Razorpay verification)
const paymentResultSchema = new mongoose.Schema({
  id: String, // Razorpay payment ID
  status: String, // success, failed, etc.
  update_time: String, // timestamp
  email_address: String, // customer email from Razorpay
});

// Main order schema
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,

    // Required payment info
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "paypal"],
      required: true,
    },
    paymentResult: paymentResultSchema, // Populated after payment verification

    // Pricing
    itemsPrice: { type: Number, required: true }, // total of all items
    shippingPrice: { type: Number, default: 0 }, // optional shipping cost
    taxPrice: { type: Number, default: 0 }, // optional tax
    totalPrice: { type: Number, required: true }, // final total

    // Payment & delivery status
    isPaid: { type: Boolean, default: false },
    paidAt: Date,

    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    shippedAt: { type: Date },
cancelledAt: { 
  type: Date,
  validate: {
    validator: function() {
      return this.status === 'cancelled'; 
    },
    message: 'cancelledAt can only be set when status is cancelled'
  }
},
cancelReason: {
  type: String,
  required: function() {
    return this.status === 'cancelled';
  }
},
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
  },
  {
    timestamps: true, // auto add createdAt & updatedAt
  }
);

module.exports = mongoose.model("Order", orderSchema);
