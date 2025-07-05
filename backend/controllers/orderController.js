const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
  const { amount, currency = "INR", receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Failed to create Razorpay order", error });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
console.log(req.body);

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  try {
   const newOrder = new Order({
  user: req.user._id,
  items: req.body.items.map((item) => ({
    product: item.product,
    title: item.title,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
  })),
  shippingAddress: req.body.address,
  paymentMethod: "card",
  paymentResult: {
    id: razorpay_payment_id,
    status: "success",
    update_time: new Date().toISOString(),
    email_address: req.user.email,
  },
  itemsPrice: req.body.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  shippingPrice: 1250,
  taxPrice: 0,
  totalPrice: req.body.amount,
  isPaid: true,
  paidAt: new Date(),
  status: "processing",
});


    await newOrder.save();

    res.status(200).json({ message: "Payment verified & order placed", order: newOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to save order", error });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to get order", error });
  }
};
