const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // your file
const { protect, verifyAdmin } = require("../middleware/authMiddleware");
const {
  getReviewsByProduct,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
} = require("../controllers/reviewController");

router.post("/", protect, upload.array("images", 5), addReview);
router.get("/:productId", getReviewsByProduct);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Admin only route
router.get("/", protect, verifyAdmin, getAllReviews);


module.exports = router;
