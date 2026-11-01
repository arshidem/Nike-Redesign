const mongoose = require("mongoose");

// Keep the server's quoted cart and delivery details until the gateway payment
// is confirmed. This also makes verification retries safe and idempotent.
const checkoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    state: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
