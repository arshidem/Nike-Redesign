const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware"); // ⬅️ import protect

// Guest routes
router.get("/", protect, cartController.getCart); // if you want getCart to only work for logged-in users
router.post("/add", protect, cartController.addToCart);
router.put("/update/:itemId", protect, cartController.updateItemQuantity);
router.delete("/remove/:itemId", protect, cartController.removeItemFromCart);
router.delete("/clear", protect, (req, res, next) => {
  console.log("🛒 DELETE /clear hit");
  next();
}, cartController.clearCart);
router.post("/apply-coupon", protect, cartController.applyCoupon);
router.post("/remove-coupon", protect, cartController.removeCoupon);

router.post("/sync", protect, cartController.syncCart);

module.exports = router;
