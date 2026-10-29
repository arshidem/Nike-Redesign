const express = require('express');
const connectDB = require('./config/db');
const { notFound } = require('./middleware/errorMiddleware');
let app;
module.exports = function getApp() {
  if (app) return app;
  app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (req, res) => res.json({ status: 'ok', application: 'nike-next' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(async (req, res, next) => {
    try { await connectDB(); next(); }
    catch { res.status(503).json({ message: 'Database is temporarily unavailable.', code: 'DATABASE_UNAVAILABLE' }); }
  });
  app.use('/api/products', require('./routes/productRoutes'));
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/cart', require('./routes/cartRoutes'));
  app.use('/api/coupons', require('./routes/couponRoutes'));
  app.use('/api/address', require('./routes/addressRoutes'));
  app.use('/api/orders', require('./routes/orderRoutes'));
  app.use('/api/reviews', require('./routes/reviewRoutes'));
  app.use('/api/wishlist', require('./routes/wishlistRoutes'));
  app.use('/api/interests', require('./routes/interestRoutes'));
  app.use('/api/media', require('./routes/mediaRoutes'));
  app.use(notFound);
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    res.status(status >= 400 && status <= 599 ? status : 500).json({ message: status < 500 ? error.message : 'The request could not be completed. Please try again later.', ...(error.code ? { code: error.code } : {}) });
  });
  return app;
};
