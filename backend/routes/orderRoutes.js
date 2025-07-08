const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// 🔐 Authenticated user required for all order routes
router.post("/initiate-payment", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-orders", protect, getUserOrders);
router.get("/:id", protect, getOrderById);

module.exports = router;
