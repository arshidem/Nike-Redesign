// routes/interestRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/interestController");

router.post("/", auth, ctrl.addInterest);
router.get("/", auth, ctrl.getInterests);
router.delete("/:id", auth, ctrl.deleteInterest);

module.exports = router;
