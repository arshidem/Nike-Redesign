// controllers/interestController.js
const Interest = require("../models/Interest");

exports.addInterest = async (req, res) => {
  const { title, category, image } = req.body;
  const user = req.user._id;

  const exists = await Interest.findOne({ user, title });
  if (exists) return res.status(400).json({ message: "Already added" });

  const interest = await Interest.create({ title, category, image, user });
  res.status(201).json(interest);
};

exports.getInterests = async (req, res) => {
  const interests = await Interest.find({ user: req.user._id });
  res.json(interests);
};

exports.deleteInterest = async (req, res) => {
  const { id } = req.params;
  const interest = await Interest.findOneAndDelete({ _id: id, user: req.user._id });
  if (!interest) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted", id });
};
