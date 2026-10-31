// controllers/orderController.js
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const CheckoutSession = require("../models/CheckoutSession");
const { quoteCart } = require("../utils/checkoutQuote");
const updateProductCartStats = require("../utils/updateProductCartStats");
const moment = require("moment-timezone");
const { sendEmail } = require("../utils/email");

const getGateway = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error("Payments are not configured. Please contact the store."), { status: 503 });
  }
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

// Create a provider order from the authenticated user's server-side cart.
exports.createOrder = async (req, res) => {
  try {
    const gateway = getGateway();
    const cart = await Cart.findOne({ userId: req.user._id }).lean();
    const snapshot = quoteCart(cart, req.body.address);
    if (Number(req.body.amount) !== snapshot.amount) {
      return res.status(409).json({ success: false, message: "Your bag total changed. Refresh checkout before paying." });
    }
    // Check the exact variant, including stores with multiple identically named colors.
    for (const item of snapshot.items) {
      const product = await Product.findById(item.product).lean();
      const variant = product?.variants?.find((value) => value._id.toString() === item.variantId);
      const size = variant?.sizes?.find((value) => value.size === item.size);
      if (!size || size.stock < item.quantity) {
        return res.status(409).json({ success: false, message: `The selected size of ${item.title} is no longer available in this quantity.` });
      }
    }
    const receipt = `rcpt_${crypto.randomBytes(12).toString("hex")}`;
    const order = await gateway.orders.create({ amount: snapshot.amount, currency: "INR", receipt, notes: { userId: req.user._id.toString() }, payment_capture: 1 });
    await CheckoutSession.create({ user: req.user._id, razorpayOrderId: order.id, snapshot });
    return res.status(200).json({ success: true, data: { keyId: process.env.RAZORPAY_KEY_ID, order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt } } });
  } catch (error) {
    console.error("Payment initialization failed:", { status: error.statusCode || error.status, code: error.error?.code, message: error.error?.description || error.message });
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Could not prepare payment. Please try again." });
  }
};

async function updateStock(item, session) {
  const product = await Product.findOneAndUpdate({
    _id: item.product,
    variants: { $elemMatch: { _id: item.variantId, sizes: { $elemMatch: { size: item.size, stock: { $gte: item.quantity } } } } },
  }, {
    $inc: { "variants.$[v].sizes.$[s].stock": -item.quantity },
  }, { arrayFilters: [{ "v._id": item.variantId }, { "s.size": item.size }], session, new: true });
  if (!product) throw Object.assign(new Error("Payment received, but stock confirmation is pending. Please retry confirmation or contact the store."), { status: 409 });
}

exports.verifyPayment = async (req, res) => {
  let session;
  try {
    const gateway = getGateway();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((value) => typeof value === "string" && value.length > 0)) {
      return res.status(400).json({ success: false, message: "Payment verification details are required" });
    }
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature) || !crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(razorpay_signature, "hex"))) {
      return res.status(400).json({ success: false, message: "Payment signature could not be verified" });
    }
    const checkout = await CheckoutSession.findOne({ user: req.user._id, razorpayOrderId: razorpay_order_id });
    if (!checkout) return res.status(404).json({ success: false, message: "Payment order not found for this account" });
    if (checkout.order) {
      const order = await Order.findById(checkout.order);
      if (!order) throw new Error("Confirmed order is temporarily unavailable");
      return res.status(200).json({ success: true, order });
    }
    const snapshot = checkout.snapshot;
    let payment = await gateway.payments.fetch(razorpay_payment_id);
    if (payment.order_id !== razorpay_order_id || payment.amount !== snapshot.amount || payment.currency !== snapshot.currency) {
      return res.status(400).json({ success: false, message: "Payment amount or order does not match checkout" });
    }
    if (payment.status === "authorized") payment = await gateway.payments.capture(razorpay_payment_id, snapshot.amount, snapshot.currency);
    if (payment.status !== "captured") return res.status(409).json({ success: false, message: "Payment confirmation is pending. Please retry confirmation." });

    session = await mongoose.startSession();
    session.startTransaction();
    const claimed = await CheckoutSession.findOneAndUpdate({ _id: checkout._id, state: "pending", order: null }, { $set: { state: "processing" } }, { session, new: true });
    if (!claimed) throw Object.assign(new Error("Order confirmation is already in progress. Please retry confirmation."), { status: 409 });
    // One transaction updates stock, creates the order and records completion.
    for (const item of snapshot.items) await updateStock(item, session);
    const [order] = await Order.create([{
      user: req.user._id, items: snapshot.items, shippingAddress: snapshot.address,
      paymentMethod: "card", paymentResult: { id: razorpay_payment_id, status: "completed", update_time: new Date().toISOString(), email_address: req.user.email },
      itemsPrice: snapshot.subtotal, shippingPrice: snapshot.shipping, taxPrice: snapshot.tax, discountPrice: snapshot.discount, couponCode: snapshot.couponCode, totalPrice: snapshot.total,
      isPaid: true, paidAt: new Date(), status: "processing",
    }], { session });
    await CheckoutSession.updateOne({ _id: checkout._id }, { $set: { state: "completed", order: order._id } }, { session });
    // Remove only purchased quantities; keep items added in another tab intact.
    const cart = await Cart.findOne({ userId: req.user._id }).session(session);
    if (cart) {
      const quantities = new Map(snapshot.items.map((item) => [`${item.product}:${item.variantId}:${item.size}`, item.quantity]));
      cart.items = cart.items.filter((item) => {
        const purchased = quantities.get(`${item.productId}:${item.variantId}:${item.size}`) || 0;
        item.quantity = Math.max(0, item.quantity - purchased);
        item.total = item.quantity * item.price;
        return item.quantity > 0;
      });
      cart.coupon = null;
      if (!cart.items.length) { cart.shippingFee = 0; cart.tax = 0; }
      const subtotal = Math.round(cart.items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
      // Use an atomic update here: Cart.save's analytics hook writes Product
      // outside this session and would wait on the stock transaction's locks.
      await Cart.updateOne({ _id: cart._id, userId: req.user._id }, { $set: {
        items: cart.items.map((item) => item.toObject ? item.toObject() : item),
        coupon: null, shippingFee: cart.shippingFee, tax: cart.tax,
        subtotal, total: Math.round((subtotal + Number(cart.shippingFee || 0) + Number(cart.tax || 0)) * 100) / 100,
      } }, { session, runValidators: true });
    }
    await session.commitTransaction();
    updateProductCartStats({ items: snapshot.items.map((item) => ({ productId: item.product })) }).catch((error) => console.error("Cart analytics update failed:", error.message));
    sendOrderConfirmation(req.user.email, { ...order.toObject(), customerName: req.user.name }).catch((error) => console.error("Order confirmation email failed:", error.message));
    return res.status(200).json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    if (session?.inTransaction()) await session.abortTransaction();
    console.error("Order confirmation failed:", { status: error.statusCode || error.status, code: error.error?.code, message: error.error?.description || error.message });
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Payment confirmation could not complete. Please retry confirmation before making another payment." });
  } finally {
    if (session) await session.endSession();
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

    await sendEmail({
      to: email,
      subject: `Order Confirmation #${order._id}`,
      html: emailHtml,
    });

    console.log(`✅ Order confirmation sent to ${email}`);
  } catch (error) {
    console.error("❌ Failed to send order confirmation:", error.response?.body || error.message);
    throw new Error("Order confirmation email failed");
  }
};
