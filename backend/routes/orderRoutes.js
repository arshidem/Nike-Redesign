const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getOrderSummary,
  getOrderTrends,
  getOrderStatusStats,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, verifyAdmin } = require("../middleware/authMiddleware");

// 🔐 Authenticated user required for all order routes
router.post("/initiate-payment", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/my-orders", protect, getUserOrders);
router.get("/", verifyAdmin, getAllOrders);
router.get("/summary", verifyAdmin, getOrderSummary);

// Daily orders chart (last 30 days)
router.get("/trends", verifyAdmin, getOrderTrends);

// Status breakdown (pie chart)
router.get("/status", verifyAdmin, getOrderStatusStats);
router.put('/:orderId/status', verifyAdmin, updateOrderStatus);

router.get("/:id", protect, getOrderById);

module.exports = router;
