const Ticket = require("../models/SupportTicket");
exports.create = async (req, res) => {
  const { category, subject, message, orderReference = "" } = req.body || {};
  if (
    !["order", "payment", "account", "other"].includes(category) ||
    typeof subject !== "string" ||
    subject.trim().length < 3 ||
    subject.trim().length > 120 ||
    typeof message !== "string" ||
    message.trim().length < 10 ||
    message.trim().length > 3000 ||
    typeof orderReference !== "string" ||
    orderReference.length > 80
  )
    return res
      .status(400)
      .json({
        message:
          "Enter a subject (3–120 characters) and message (10–3000 characters).",
      });
  try {
    const ticket = await Ticket.create({
      user: req.user._id,
      category,
      subject: subject.trim(),
      message: message.trim(),
      orderReference: orderReference.trim(),
    });
    return res.status(201).json(ticket);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not submit support request" });
  }
};
exports.mine = async (req, res) => {
  try {
    return res.json(
      await Ticket.find({ user: req.user._id })
        .select("-user")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    );
  } catch (error) {
    return res.status(500).json({ message: "Could not load support requests" });
  }
};
exports.all = async (req, res) => {
  try {
    return res.json(
      await Ticket.find({})
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    );
  } catch (error) {
    return res.status(500).json({ message: "Could not load support requests" });
  }
};
exports.update = async (req, res) => {
  if (!["open", "in-progress", "closed"].includes(req.body?.status))
    return res.status(400).json({ message: "Invalid request status" });
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true, runValidators: true },
    ).populate("user", "name email");
    if (!ticket) return res.status(404).json({ message: "Request not found" });
    return res.json(ticket);
  } catch (error) {
    return res.status(400).json({ message: "Could not update request" });
  }
};
