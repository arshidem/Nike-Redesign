const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables FIRST
dotenv.config();

// Initialize express app
const app = express();
const { Server } = require("socket.io");
const server = http.createServer(app);

// Socket.io setup
const io = require("socket.io")(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_URL_HOST],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Important for Vercel deployments
});

// Connect to MongoDB
connectDB();

// CORS middleware - should match Socket.io CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_HOST,
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
};

app.use(cors(corsOptions));
// Socket.io connection handler

const { adminSockets } = require("./utils/socketState"); // ✅ Use shared instance

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("identify", (user) => {
    if (user.role === "admin") {
      adminSockets.set(socket.id, user); // Correct for Map
      console.log("Admin connected:", user.email);
    }
  });
  socket.on("disconnect", () => {
    adminSockets.delete(socket.id); // Correct for Map
  });
});

// Make io accessible in routes
app.set("io", io);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    socket: io.engine.clientsCount ? "connected" : "disconnected",
  });
});

// Import route files
const productRouter = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require("./routes/cartRoutes");
const couponRoutes = require("./routes/couponRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Mount routes
app.use("/api/products", productRouter);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen to support Socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Socket.io ready for connections`);
});
