const router = require("express").Router();
const { protect, verifyAdmin } = require("../middleware/authMiddleware");
const controller = require("../controllers/supportController");
router.get("/admin", verifyAdmin, controller.all);
router.patch("/:id/status", verifyAdmin, controller.update);
router.get("/", protect, controller.mine);
router.post("/", protect, controller.create);
module.exports = router;
