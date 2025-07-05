const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon"); // import your Coupon model

// Helper to find the cart
const findCart = async (userId) => {
  return await Cart.findOne({ userId });
};


// GET /api/cart

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user?._id;

    // If user not logged in, return empty cart
    if (!userId) {
      return res.status(200).json({ items: [], total: 0, shippingFee: 0 });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ items: [], total: 0, shippingFee: 0 });
    }

    res.status(200).json(cart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ error: "Failed to get cart" });
  }
};





// POST /api/cart/add
exports.addToCart = async (req, res) => {
  // If user is not authenticated, let frontend handle local cart
  console.log("Received token:", req.headers.authorization);

  if (!req.user?._id) {
    return res.status(401).json({ error: "Not logged in — handle guest cart in frontend" });
  }

  const { productId, variantId, size, quantity } = req.body;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    const sizeInfo = variant.sizes.find(s => s.size === size);
    if (!sizeInfo || sizeInfo.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const price = product.finalPrice;
    const stock = sizeInfo.stock;
    const gender = product.gender || "unisex";

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId });

    const existingItem = cart.items.find(item =>
      item.productId.toString() === productId &&
      item.variantId.toString() === variantId &&
      item.size === size
    );

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > stock) {
        return res.status(400).json({ error: `Only ${stock} available` });
      }
      existingItem.quantity = newQty;
      existingItem.total = newQty * price;
    } else {
      cart.items.push({
        productId,
        variantId,
        name: product.name,
        image: variant.images?.[0],
        color: variant.color,
        size,
        price,
        quantity,
        total: quantity * price,
        stock,
        gender,
        stockAvailable: stock > 0
      });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
};


// PUT /api/cart/update/:itemId
exports.updateItemQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user?._id || null;

  try {
    const cart = await findCart(userId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variant = product.variants.id(item.variantId);
    if (!variant) return res.status(404).json({ error: "Variant not found" });

    const sizeObj = variant.sizes.find(s => s.size === item.size);
    if (!sizeObj) return res.status(404).json({ error: "Size not found" });

    const realStock = sizeObj.stock;

    if (quantity > realStock) {
      return res.status(400).json({
        error: `Only ${realStock} item${realStock > 1 ? "s" : ""} left in stock`,
        available: realStock
      });
    }

    item.quantity = quantity;
    item.total = quantity * item.price;
    item.stockAvailable = realStock > 0;

    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

// DELETE /api/cart/remove/:itemId
exports.removeItemFromCart = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user?._id || null;

  try {
    const cart = await findCart(userId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  const userId = req.user?._id || null;

  try {
    const cart = await findCart(userId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.status(200).json({ message: "Cart cleared", cart });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

// POST /api/cart/apply-coupon

exports.applyCoupon = async (req, res) => {
  const { code } = req.body;
  const userId = req.user?._id || null;

  try {
    const cart = await findCart(userId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(400).json({ error: "Invalid or expired coupon" });

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    if (coupon.minOrderAmount > cart.total) {
      return res.status(400).json({
        error: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
      });
    }

    const discountAmount =
      coupon.discountType === "percent"
        ? (cart.total * coupon.discountValue) / 100
        : coupon.discountValue;

    cart.coupon = {
      code: coupon.code,
      discountAmount,
      applied: true,
    };

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("Apply coupon failed:", err);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
};
exports.removeCoupon = async (req, res) => {
  const userId = req.user?._id || null;

  try {
    const cart = await findCart(userId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.coupon = {
      code: null,
      discountAmount: 0,
      applied: false,
    };

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    console.error("Remove coupon failed:", err);
    res.status(500).json({ error: "Failed to remove coupon" });
  }
};


exports.syncCart = async (req, res) => {
  const userId = req.user.id;
  const incomingItems = req.body.items;

  if (!Array.isArray(incomingItems)) {
    return res.status(400).json({ error: "Invalid cart data" });
  }

  try {
    // Fetch or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Merge logic (avoid duplicates)
    for (const incoming of incomingItems) {
      const exists = cart.items.find(
        (item) =>
          item.productId.toString() === incoming.productId &&
          item.variantId === incoming.variantId &&
          item.size === incoming.size
      );

      if (exists) {
        exists.quantity += incoming.quantity;
        exists.total = exists.quantity * exists.price;
      } else {
        cart.items.push(incoming);
      }
    }

    // Update total
    cart.total = cart.items.reduce((sum, i) => sum + i.total, 0);

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("Sync failed:", err);
    res.status(500).json({ error: "Cart sync failed" });
  }
};