// controllers/orderController.js
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const SibApiV3Sdk = require('@sendinblue/client');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order

// Initialize Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;
    const userId = req.user._id;
    console.log("🧾 Requested amount (paise):", amount);

    if (amount > 50000000) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds maximum limit allowed by Razorpay (₹5,00,000)",
      });
    }

    const options = {
      amount,
      currency: "INR",
      receipt,
      notes: {
        ...notes,
        userId: userId.toString(),
      },
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment order" });
  }
};

// Helper function to update stock
async function updateStock({ product, color, size, quantity, session }) {
  const result = await Product.findOneAndUpdate(
    {
      _id: product,
      "variants.color": color,
      "variants.sizes.size": size,
    },
    {
      $inc: {
        "variants.$[v].sizes.$[s].stock": -quantity,
        sold: quantity,
        "variants.$[v].sizes.$[s].sold": quantity,
      },
      $set: { lastStockUpdate: new Date() },
    },
    {
      arrayFilters: [{ "v.color": color }, { "s.size": size }],
      session,
      new: true,
    }
  );

  if (!result)
    throw new Error(`Stock update failed for ${product} (${color}, ${size})`);
  return result;
}

// Verify payment and place order
exports.verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verify Razorpay signature
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
    } = req.body;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid signature",
      });
    }

    // 2. Calculate totals
    const itemsPrice = req.body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingPrice = 1250;
    const taxPrice = Math.round(itemsPrice * 0.05);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // 3. Create order document
    const orderData = {
      user: req.user._id,
      items: req.body.items.map((item) => ({
        product: item.product,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        variantId: item.variantId,
      })),
      shippingAddress: req.body.address,
      paymentMethod: "card",
      paymentResult: {
        id: razorpay_payment_id,
        status: "completed",
        update_time: new Date(),
        email_address: email,
      },
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: true,
      paidAt: new Date(),
      status: "processing",
    };

    // 4. Create order in database
    const newOrder = await Order.create([orderData], { session });

    // 5. Validate and update stock for all items
    const stockUpdates = await Promise.all(
      req.body.items.map(async (item) => {
        try {
          const product = await Product.findById(item.product)
            .session(session)
            .lean();

          const variant = product?.variants?.find(
            (v) => v.color === item.color
          );
          const sizeObj = variant?.sizes?.find((s) => s.size === item.size);

          if (!variant || !sizeObj || sizeObj.stock < item.quantity) {
            throw new Error(`
              Stock validation failed for:
              Product: ${item.product}
              Color: ${item.color}
              Size: ${item.size}
              Requested: ${item.quantity}
              Available: ${sizeObj?.stock || 0}
            `);
          }

          const updated = await updateStock({
            product: item.product,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            session,
          });

          return {
            success: true,
            productId: item.product,
            newStock: updated.variants
              .find((v) => v.color === item.color)
              .sizes.find((s) => s.size === item.size).stock,
          };
        } catch (error) {
          return {
            success: false,
            productId: item.product,
            error: error.message,
          };
        }
      })
    );

    // 6. Check for failed stock updates
    const failedUpdates = stockUpdates.filter((update) => !update.success);
    if (failedUpdates.length > 0) {
      throw new Error(
        `Stock update failed for ${failedUpdates.length} items:\n` +
          failedUpdates.map((f) => f.error).join("\n")
      );
    }

    // 7. Commit transaction
    await session.commitTransaction();
    console.log(orderData);

    // 8. Send order confirmation email (non-critical)
try {
  await sendOrderConfirmation(email, {
    ...newOrder[0].toObject(),
    customerName: req.user.name
  });
} catch (emailError) {
  console.error("Order confirmation email failed:", emailError);
}


    // 9. Success response
    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder[0],
      stockUpdates: stockUpdates.map((u) => ({
        productId: u.productId,
        newStock: u.newStock,
      })),
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Order processing failed:", error);

    res.status(500).json({
      success: false,
      message: "Order processing failed",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
              failedItems: req.body.items,
            }
          : undefined,
    });
  } finally {
    session.endSession();
  }
};

// Get user orders
// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const totalOrders = await Order.countDocuments({ user: req.user._id });

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.product", "name featuredImg")
      .lean();

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Get user orders failed:", error);
    res.status(500).json({ success: false, message: "Failed to get orders" });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to get order", error });
  }
};

// @desc    Get all orders with search, filters, and pagination
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      minTotalPrice,
      maxTotalPrice,
      isDelivered,
      sort = "-createdAt",  // ✅ default sort if none provided
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    // ✅ Status filter
    if (status) {
      query.status = status;
    }

    // ✅ Date range filter
// ✅ Date range filter
if (startDate || endDate) {
  query.createdAt = {};
  if (startDate) {
    // Set to start of the day in local time
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    query.createdAt.$gte = start;
  }
  if (endDate) {
    // Set to end of the day in local time
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt.$lte = end;
  }
}


 // ✅ Total price filter with proper checks
if (minTotalPrice != null || maxTotalPrice != null) {
  query.totalPrice = {};
  if (minTotalPrice != null && minTotalPrice !== "") {
    query.totalPrice.$gte = Number(minTotalPrice);
  }
  if (maxTotalPrice != null && maxTotalPrice !== "") {
    query.totalPrice.$lte = Number(maxTotalPrice);
  }
}


    // ✅ isDelivered filter
    if (isDelivered === "true" || isDelivered === "false") {
      query.isDelivered = isDelivered === "true";
    }

    // ✅ Search by user name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const userIds = users.map((u) => u._id);
      query.user = { $in: userIds };
    }

    // ✅ Sort support
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith("-") ? -1 : 1;
    const sortQuery = { [sortField]: sortOrder };

    // ✅ Pagination
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort(sortQuery) // ✅ uses dynamic sort
      .skip(skip)
      .limit(pageSize);


    res.json({
      success: true,
      orders,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: pageNumber,
        
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      error: error.message,
    });
  }
};
/**
 * @desc    Update order status
 * @route   PUT /api/orders/:orderId/status
 * @access  Admin only
 */
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;

    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    } else {
      order.isDelivered = false;
      order.deliveredAt = null;
    }

    const updatedOrder = await order.save();

    return res.status(200).json({
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// @desc    Bulk update order statuses (e.g., cancel, ship)
// @route   PATCH /api/orders/bulk-update
// @access  Admin
exports.bulkUpdateOrders = async (req, res) => {
  const { orderIds, status, cancelReason } = req.body;
  const adminId = req.user._id; // from auth middleware

  if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  try {
    const updates = {
      status,
      updatedBy: adminId,
    };

    if (status === "cancelled") {
      updates.cancelledAt = new Date();
      updates.cancelReason = cancelReason || "No reason provided";
    }

    if (status === "shipped") {
      updates.shippedAt = new Date();
    }

    if (status === "delivered") {
      updates.deliveredAt = new Date();
      updates.isDelivered = true;
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} orders updated`,
    });
  } catch (error) {
    console.error("Bulk update failed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getOrderSummary = async (req, res) => {
  try {
    const startOfToday = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const startOfWeek = moment().tz('Asia/Kolkata').startOf('week').toDate();
    const startOfMonth = moment().tz('Asia/Kolkata').startOf('month').toDate();

    const [todayStats, weekStats, monthStats, totalStats] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      todayOrders: todayStats[0]?.count || 0,
      todayRevenue: todayStats[0]?.revenue || 0,
      weekOrders: weekStats[0]?.count || 0,
      weekRevenue: weekStats[0]?.revenue || 0,
      monthOrders: monthStats[0]?.count || 0,
      monthRevenue: monthStats[0]?.revenue || 0,
      totalOrders: totalStats[0]?.count || 0,
      totalRevenue: totalStats[0]?.revenue || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Error getting order summary", error });
  }
};


exports.getOrderTrends = async (req, res) => {
  try {
    const range = req.query.range || "daily"; // default to daily
    const timezone = "Asia/Kolkata";

    let matchStage = {};
    let groupStage = {};

    // Set date range for last 30 units (days/weeks/months/years)
    let start;

    switch (range) {
      case "weekly":
        start = moment().tz(timezone).subtract(12, "weeks").startOf("week").toDate(); // last 12 weeks
        groupStage = {
          _id: { $isoWeek: "$createdAt" },
          year: { $first: { $isoWeekYear: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        };
        break;

      case "monthly":
        start = moment().tz(timezone).subtract(11, "months").startOf("month").toDate(); // last 12 months
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        };
        break;

      case "yearly":
        start = moment().tz(timezone).subtract(5, "years").startOf("year").toDate(); // last 6 years
        groupStage = {
          _id: { $year: "$createdAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        };
        break;

      case "daily":
      default:
        start = moment().tz(timezone).subtract(29, "days").startOf("day").toDate(); // last 30 days
        groupStage = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        };
        break;
    }

    matchStage = { createdAt: { $gte: start } };

    const stats = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } },
    ]);

    // If weekly, add year to the ID to avoid same week numbers across years
    if (range === "weekly") {
      const formattedStats = stats.map((item) => ({
        _id: `${item.year}-W${String(item._id).padStart(2, "0")}`, // example: "2025-W07"
        count: item.count,
        revenue: item.revenue,
      }));
      return res.json(formattedStats);
    }

    res.json(stats);
  } catch (error) {
    console.error("Error in getOrderTrends:", error);
    res.status(500).json({ message: "Error getting order trends", error });
  }
};



exports.getOrderStatusStats = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    let start, end;
    const now = moment().tz("Asia/Kolkata");

    switch (range) {
      case "today":
        start = now.clone().startOf("day");
        end = now.clone().endOf("day");
        break;
      case "week":
        start = now.clone().startOf("week");
        end = now.clone().endOf("week");
        break;
      case "month":
        start = now.clone().startOf("month");
        end = now.clone().endOf("month");
        break;
      case "year":
        start = now.clone().startOf("year");
        end = now.clone().endOf("year");
        break;
      case "custom":
        if (!startDate || !endDate) {
          return res.status(400).json({ message: "Start and end date required for custom range" });
        }
        start = moment(startDate).startOf("day");
        end = moment(endDate).endOf("day");
        break;
      default:
        // No filter — return all-time stats
        start = null;
        end = null;
    }

    const matchStage = start && end ? { createdAt: { $gte: start.toDate(), $lte: end.toDate() } } : {};

    const statusCounts = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(statusCounts);
  } catch (error) {
    res.status(500).json({ message: "Error getting status stats", error });
  }
};


const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendOrderConfirmation = async (email, order) => {
  try {
    if (!email) {
      console.error("No recipient email provided!");
      return;
    }

    if (!order.items || !Array.isArray(order.items)) {
      console.error("Order has no items:", order);
      return;
    }

    // Format items
    const itemsHtml = order.items.map((item) => `
      <tr>
        <td>${item.title || item.name} (${item.color || ""}, Size ${item.size || ""})</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.quantity}</td>
      </tr>
    `).join("");

    // Delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    const emailHtml = `
      <h2>Thank you for your order, ${order.customerName || "Customer"}!</h2>
      <p>Order #${order._id}</p>
      <h3>Order Summary</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th>Item</th><th>Qty</th><th>Price</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Total:</strong> ₹${order.totalPrice}</p>
      <p><strong>Expected Delivery:</strong> ${deliveryDate.toDateString()}</p>
    `;

    console.log("Sending order confirmation email to:", email);

    await client.sendTransacEmail({
      sender: { name: "Nike Redesign", email: process.env.SENDER_EMAIL },
      to: [{ email }],
      subject: `Order Confirmation #${order._id}`,
      htmlContent: emailHtml,
    });

    console.log(`✅ Order confirmation sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send order confirmation:", error.response?.body || error.message);
    throw new Error("Order confirmation email failed");
  }
};
