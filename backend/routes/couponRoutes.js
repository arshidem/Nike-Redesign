// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.post('/',verifyAdmin, couponController.createCoupon);
router.get('/', verifyAdmin,couponController.getCoupons);
router.put('/:id',verifyAdmin, couponController.updateCoupon);
router.delete('/:id',verifyAdmin, couponController.deleteCoupon);

module.exports = router;