const express = require("express");
const Product=require('../models/Product')
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
  getProductById,
  getFeaturedProducts ,
  getProductAnalytics,
  bulkDeleteProducts,
  getBestSellers,
  getSuggestedProducts,
  searchProducts
} = require("../controllers/productController");

const { verifyAdmin } = require("../middleware/authMiddleware");

// 🔓 Public Routes
// 🔓 Public Routes
router.get("/filter-options", getFilterOptions); 
router.get("/top", getTopSellingProducts);
router.get("/id/:id", getProductById);
router.get("/analytics", verifyAdmin, getProductAnalytics); // ✅ Correct position
router.get("/featured", getFeaturedProducts);
router.delete('/bulk-delete', verifyAdmin, bulkDeleteProducts);
router.get(["/best-sellers", "/products/best-sellers"], getBestSellers);
router.get('/search', searchProducts);
router.get("/test", async (req, res) => {     // ✅ Move this up
  console.log("📦 /test route hit"); // 👈 add this

  try {
    const products = await Product.find({});
    console.log("✅ Products fetched:", products.length);
    res.json(products);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "DB query failed" });
  }});
  router.get("/:productSlug/suggestions", getSuggestedProducts);

router.get("/:slug", getProductBySlug); // ✅ Should always be last among GET routes
router.get("/", getAllProducts);



// 🔐 Admin Routes
router.post(
  "/",
  verifyAdmin,
  upload.any(),
  createProduct
);
router.put(
  '/:slug',
  verifyAdmin,
  upload.fields([
    { name: 'featuredImg', maxCount: 1 },
    { name: 'variant_*_images' }
  ]),
  updateProduct
);
  
  // 3. Use Multer's built-in error handling with your cleanup
  
  


router.delete("/:id",verifyAdmin, deleteProduct);

module.exports = router;
