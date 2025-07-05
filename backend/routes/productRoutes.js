const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // ✅ only once

const {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getTopSellingProducts,
  getFilterOptions,
  getProductById
} = require("../controllers/productController");

const { verifyAdmin } = require("../middleware/authMiddleware");

// 🔓 Public Routes
// 🔓 Public Routes
router.get("/filter-options", getFilterOptions); // ✅ Correct order
router.get("/top", getTopSellingProducts);
router.get("/:slug", getProductBySlug);
router.get("/id/:id", getProductById);
router.get("/", getAllProducts);

// 🔐 Admin Routes
router.post(
  "/",
  verifyAdmin,
  upload.any(),
  createProduct
);
router.put(
  "/:slug",
  // 1. First verify admin status
  verifyAdmin,
  
  // 2. Use upload.fields() instead of upload.any()
  upload.any(),

  
  // 3. Process the update
  updateProduct,
  
  // 4. Error handling middleware (will catch errors from both upload and updateProduct)
  (err, req, res, next) => {
    console.error('Request error:', err);
    
    // Clean up any uploaded files
    if (req.files) {
      const files = Object.values(req.files).flat();
      files.forEach(file => {
        if (file.path) {
          fs.unlink(file.path, () => {});
        }
      });
    }
    
    // Handle different error types
    const statusCode = err instanceof multer.MulterError ? 400 : 500;
    const message = err instanceof multer.MulterError 
      ? `File upload error: ${err.message}` 
      : 'Product update failed';
    
    res.status(statusCode).json({ 
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
);
  
  // 3. Use Multer's built-in error handling with your cleanup
  
  


router.delete("/:id",verifyAdmin, deleteProduct);

module.exports = router;
