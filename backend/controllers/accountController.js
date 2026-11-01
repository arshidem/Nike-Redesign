const User = require("../models/User");
const Address = require("../models/Address");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");
const profile = require("../utils/customerProfile");
exports.getPreferences = (req, res) => res.json(profile(req.user).preferences);
exports.updatePreferences = async (req, res) => {
  const email = req.body?.notifications?.email;
  if (typeof email !== "boolean")
    return res
      .status(400)
      .json({ message: "Choose whether to receive offers by email." });
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { "preferences.notifications.email": email } },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(404).json({ message: "Account not found" });
    return res.json(profile(user).preferences);
  } catch (error) {
    return res.status(500).json({ message: "Could not save preferences" });
  }
};
exports.exportData = async (req, res) => {
  try {
    const owner = req.user._id;
    const [addresses, orders, wishlist] = await Promise.all([
      Address.find({ user: owner })
        .select(
          "fullName phone street city state postalCode country isDefault createdAt",
        )
        .lean(),
      Order.find({ user: owner })
        .select(
          "items shippingAddress status createdAt itemsPrice shippingPrice taxPrice discountPrice totalPrice isPaid paidAt",
        )
        .sort({ createdAt: -1 })
        .lean(),
      Wishlist.findOne({ user: owner }).select("products").lean(),
    ]);
    return res.json({
      exportedAt: new Date().toISOString(),
      profile: profile(req.user),
      addresses,
      orders,
      wishlist: wishlist?.products || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not export account data" });
  }
};
