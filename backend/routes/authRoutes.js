const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  requestOTP,
  verifyOTP,
  completeRegistration,
  logout,
  getMe,
  updateUserData,
  deleteUser
} = require("../controllers/authController");

router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/complete-registration", completeRegistration);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/me", protect,updateUserData);
router.delete("/me", protect,deleteUser);

module.exports = router;
