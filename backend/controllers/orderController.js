const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const nodemailer = require("nodemailer");

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;
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

    // 3. Create order
    const newOrder = await Order.create(
      [{
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
      }],
      { session }
    );

    // 4. Validate and update stock for all items
    const stockUpdates = await Promise.all(
      req.body.items.map(async (item) => {
        try {
          const product = await Product.findById(item.product).lean();
          const variant = product?.variants?.find(v => v.color === item.color);
          const sizeObj = variant?.sizes?.find(s => s.size === item.size);

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
              .find(v => v.color === item.color).sizes
              .find(s => s.size === item.size).stock,
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

    // 5. If any failed updates, abort
    const failedUpdates = stockUpdates.filter(update => !update.success);
    if (failedUpdates.length > 0) {
      throw new Error(
        `Stock update failed for ${failedUpdates.length} items:\n` +
        failedUpdates.map(f => f.error).join('\n')
      );
    }

    // 6. Commit transaction
// 6. Commit transaction
await session.commitTransaction();

// 7. Send confirmation email (non-critical)
// 7. Send test email (non-critical)
try {
// Send to actual customer email with real order data
await sendOrderConfirmation(
  req.body.email, // Customer's email from request
  newOrder[0]     // The created order document
);  console.log("Test email was sent successfully");
} catch (emailError) {
  console.error("Test email failed:", emailError);
}
    // 8. Success response
    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder[0],
      stockUpdates: stockUpdates.map(u => ({
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
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
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


const sendOrderConfirmation = async (email, order) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false }, // For self-signed certificates
    });

    // Format order items
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.title} (${item.color}, Size ${item.size})</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    // Calculate delivery date (5 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    // Simple but effective HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .order-table { width: 100%; border-collapse: collapse; }
    .order-table th, .order-table td { padding: 8px; border: 1px solid #ddd; }
    .order-table th { background-color: #f2f2f2; }
    .address-box { background: #f9f9f9; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <h2>Thank you for your order!</h2>
  <p>Order #${order._id}</p>
  
  <h3>Order Summary</h3>
  <table class="order-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div style="margin-top: 20px;">
    <p><strong>Subtotal:</strong> ₹${order.itemsPrice}</p>
    <p><strong>Shipping:</strong> ₹${order.shippingPrice}</p>
    <p><strong>Tax:</strong> ₹${order.taxPrice}</p>
    <p><strong>Total:</strong> ₹${order.totalPrice}</p>
  </div>

  <div class="address-box">
    <h3>Shipping Address</h3>
    <p>${order.shippingAddress.fullName}</p>
    <p>${order.shippingAddress.street}</p>
    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}</p>
    <p>${order.shippingAddress.country}</p>
    <p><strong>Expected Delivery:</strong> ${deliveryDate.toDateString()}</p>
  </div>

  <p>Payment Method: Razorpay (${order.paymentResult?.id || 'N/A'})</p>
  <p>Need help? Contact <a href="mailto:support@yourstore.com">support@yourstore.com</a></p>
</body>
</html>
    `;

    // Plain text version for email clients that prefer it
    const textVersion = `
Thank you for your order (#${order._id})

Order Summary:
${order.items.map(item => `${item.title} (${item.color}, Size ${item.size}) - ${item.quantity} x ₹${item.price} = ₹${item.price * item.quantity}`).join('\n')}

Subtotal: ₹${order.itemsPrice}
Shipping: ₹${order.shippingPrice}
Tax: ₹${order.taxPrice}
Total: ₹${order.totalPrice}

Shipping Address:
${order.shippingAddress.fullName}
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}
${order.shippingAddress.country}

Expected Delivery: ${deliveryDate.toDateString()}
Payment Method: Razorpay (${order.paymentResult?.id || 'N/A'})
    `;

    await transporter.sendMail({
      from: `"Fake Store" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: `Order Confirmation #${order._id}`,
      text: textVersion,
      html: emailHtml,
    });

    console.log(`Order confirmation sent to ${email}`);
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    throw error; // Re-throw to handle in calling function
  }
};