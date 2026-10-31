const error = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const paise = (value) => Math.round(Number(value) * 100);

function normalizeAddress(input = {}) {
  const address = {};
  for (const key of [
    "fullName",
    "phone",
    "street",
    "city",
    "state",
    "postalCode",
    "country",
  ]) {
    address[key] = typeof input[key] === "string" ? input[key].trim() : "";
    if (!address[key]) throw error(`Delivery ${key} is required`);
  }
  if (
    !/^\+?[\d\s()-]{10,20}$/.test(address.phone) ||
    address.phone.replace(/\D/g, "").length < 10
  )
    throw error("Please enter a valid phone number");
  if (
    address.country.toLowerCase() === "india" &&
    !/^\d{6}$/.test(address.postalCode)
  )
    throw error("Please enter a valid 6-digit PIN code");
  return address;
}

function quoteCart(cart, address) {
  if (!cart?.items?.length) throw error("Your bag is empty");
  const items = cart.items.map((item) => {
    const quantity = Number(item.quantity),
      price = Number(item.price);
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(price) ||
      price < 0
    )
      throw error("Your bag contains an invalid item");
    if (!item.productId || !item.variantId || !item.size)
      throw error("Please re-add this item with a color and size");
    return {
      product: item.productId.toString(),
      variantId: item.variantId.toString(),
      title: item.name,
      image: item.image,
      price,
      quantity,
      size: item.size,
      color: item.color,
    };
  });
  const subtotalPaise = items.reduce(
    (sum, item) => sum + paise(item.price) * item.quantity,
    0,
  );
  const shippingPaise = paise(cart.shippingFee ?? 150),
    taxPaise = paise(cart.tax ?? 0);
  const discountPaise = cart.coupon?.applied
    ? paise(cart.coupon.discountAmount || 0)
    : 0;
  if (
    ![shippingPaise, taxPaise, discountPaise].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    ) ||
    discountPaise > subtotalPaise
  )
    throw error("Your bag totals need refreshing");
  const amount = subtotalPaise + shippingPaise + taxPaise - discountPaise;
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 50000000)
    throw error("Order total must be between ₹1 and ₹5,00,000");
  return {
    items,
    address: normalizeAddress(address),
    amount,
    currency: "INR",
    subtotal: subtotalPaise / 100,
    shipping: shippingPaise / 100,
    tax: taxPaise / 100,
    discount: discountPaise / 100,
    total: amount / 100,
    couponCode: cart.coupon?.applied ? cart.coupon.code : null,
  };
}

module.exports = { quoteCart, normalizeAddress };
