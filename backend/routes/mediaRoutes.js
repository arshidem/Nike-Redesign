const express = require('express');
const { randomUUID } = require('node:crypto');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('../config/cloudinary');
const { configured } = require('../services/media');
const router = express.Router();
router.post('/sign', protect, (req, res) => {
  if (!['product','review'].includes(req.body.purpose)) return res.status(400).json({ message: 'Invalid upload purpose' });
  if (req.body.purpose === 'product' && req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  if (!configured()) return res.status(503).json({ message: 'Media storage is not configured' });
  const params = { timestamp: Math.floor(Date.now() / 1000), folder: `nike/${req.user._id}/${randomUUID()}` };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  res.json({ ...params, signature, api_key: process.env.CLOUDINARY_API_KEY, cloud_name: process.env.CLOUDINARY_CLOUD_NAME });
});
module.exports = router;
