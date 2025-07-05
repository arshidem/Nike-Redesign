const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");

// All routes require authentication
router.post("/", protect, addAddress);           // Add new address
router.get("/", protect, getAddresses);          // Get all addresses of logged-in user
router.put("/:id", protect, updateAddress);      // Update an address by ID
router.delete("/:id", protect, deleteAddress);   // Delete an address by ID

module.exports = router;
