const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();
https://nike-redesign.onrender.com
// Global middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nike-redesign-six.vercel.app'
  ],
  credentials: true
}));


app.use(express.json()); // Parses incoming JSON requests

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use(express.urlencoded({ extended: true }));
// Health check route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Import route files
const productRouter = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes =require('./routes/cartRoutes');
const couponRoutes = require('./routes/couponRoutes');
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Mount routes
app.use("/api/products", productRouter);
app.use("/api/auth", authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
