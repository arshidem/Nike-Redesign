const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const { code, isActive } = req.query;
    const query = {};
    if (code) query.code = new RegExp(code, 'i');
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, error: 'Coupon not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Coupon not found' });
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.getAvailable = async (req, res) => {
  try {
    const coupons = await Coupon.find({isActive:true,$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]})
      .select("code discountType discountValue minOrderAmount expiresAt").sort({createdAt:-1}).lean();
    return res.json(coupons);
  } catch(error) { return res.status(500).json({message:"Could not load offers"}); }
};
