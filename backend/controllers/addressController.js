// src/controllers/addressController.js

const Address = require("../models/Address");

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;
    const userId = req.user._id;

    if (isDefault) {
      await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      user: userId,
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: !!isDefault
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ message: "Failed to add address", error });
  }
};

// @desc    Get all addresses for logged in user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1 });
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch addresses", error });
  }
};

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, street, city, state, postalCode, country, isDefault } = req.body;

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    address.fullName = fullName;
    address.phone = phone;
    address.street = street;
    address.city = city;
    address.state = state;
    address.postalCode = postalCode;
    address.country = country;
    address.isDefault = !!isDefault;

    await address.save();
    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: "Failed to update address", error });
  }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

    if (!address) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete address", error });
  }
};
