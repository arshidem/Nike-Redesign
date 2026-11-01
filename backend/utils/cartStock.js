const Product = require("../models/Product");

// One inventory read per bag/checkout entry, never per quantity-button click.
async function refreshCartStock(items) {
  const ids = [...new Set(items.map((item) => String(item.productId)))];
  if (!ids.length) return items;
  const products = await Product.find({ _id: { $in: ids } })
    .select("variants._id variants.sizes")
    .lean();
  const byId = new Map(
    products.map((product) => [String(product._id), product]),
  );
  return items.map((item) => {
    const variant = byId
      .get(String(item.productId))
      ?.variants?.find((entry) => String(entry._id) === String(item.variantId));
    const size = variant?.sizes?.find((entry) => entry.size === item.size);
    const stock = Math.max(0, Number(size?.stock) || 0);
    return { ...item, stock, stockAvailable: stock > 0 };
  });
}
module.exports = { refreshCartStock };
