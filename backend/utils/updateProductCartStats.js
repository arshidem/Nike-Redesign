let Product;
let Cart;

const updateProductCartStats = async (cartDoc) => {
  try {
    if (!Product) Product = require("../models/Product");
    if (!Cart) Cart = require("../models/Cart");

    const productIds = [...new Set(cartDoc.items.map(i => i.productId.toString()))];

    for (const productId of productIds) {
      const activeCarts = await Cart.find({
        status: 'active',
        'items.productId': productId,
      });

      let totalCartQuantity = 0;

      for (const cart of activeCarts) {
        for (const item of cart.items) {
          if (item.productId.toString() === productId) {
            totalCartQuantity += item.quantity;
          }
        }
      }

      await Product.findByIdAndUpdate(productId, {
        $set: {
          'cartStats.totalCartQuantity': totalCartQuantity,
          'cartStats.lastUpdated': new Date(),
        },
      });
    }
  } catch (err) {
    console.error("⚠️ Failed to update cart stats:", err.message);
  }
};

module.exports = updateProductCartStats;
