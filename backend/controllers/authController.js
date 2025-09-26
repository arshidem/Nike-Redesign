// src/controllers/authController.js

const User = require("../models/User");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const SibApiV3Sdk = require('@sendinblue/client');

// Helpers
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });


const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendOTP = async (email, otp) => {
  try {
    await client.sendTransacEmail({
      sender: { name: 'Nike Redesign', email: process.env.SENDER_EMAIL },
      to: [{ email }],
      subject: 'Your OTP Code',
      htmlContent: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw new Error('OTP sending failed');
  }
};


// Request OTP
// src/controllers/authController.js

exports.requestOTP = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  // Only update OTP for existing users
  const user = await User.findOne({ email });
  if (user) {
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
  }

  // Send OTP regardless
  await sendOTP(email, otp);
  return res
    .status(200)
    .json({ message: "OTP sent", type: user ? "signin" : "register" });
};


// Verify OTP
// src/controllers/authController.js

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const user = await User.findOne({ email }).select("+otp +otpExpires");

  // CASE A: No user in DB → new user flow
  if (!user) {
    return res.status(200).json({ newUser: true, email });
  }

  // CASE B: Existing user, validate OTP
  const isExpired = !user.otpExpires || user.otpExpires < new Date();
  const isMismatch = user.otp !== otp;
  if (isExpired || isMismatch) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // ✅ OTP valid — clear it
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  // CASE C: User exists but missing profile → treat as newUser
  if (!user.name || !user.gender) {
    return res.status(200).json({ newUser: true, email });
  }

  // CASE D: Fully registered user → login
  const activeUser = await User.handleLogin(user._id);
  const token = generateToken(user._id);
  return res.status(200).json({
    token,
    user: { 
      _id: activeUser._id,
      name: activeUser.name,
      email: activeUser.email,
      gender: activeUser.gender,
      isActive: activeUser.isActive,
      lastLogin: activeUser.lastLogin
    },
  });
};


// Complete Registration
exports.completeRegistration = async (req, res) => {
  const { name, gender, email } = req.body;

  if (!name || !gender || !email) {
    return res.status(400).json({ message: "Name, gender and email are required" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = new User({ name, gender, email });
  await user.save();

  const token = generateToken(user._id);
  const activeUser = await User.handleLogin(user._id);

  return res.status(200).json({
    token,
    user: {
      _id: activeUser._id,
      name: activeUser.name,
      email: activeUser.email,
      gender: activeUser.gender,
      isActive: activeUser.isActive,
      lastLogin: activeUser.lastLogin
    }
  });
};

// Logout
exports.logout = async (req, res) => {
  try {
    const user = await User.handleLogout(req.user._id);
    res.status(200).json({
      message: "Logged out successfully",
      user: {
        _id: user._id,
        isActive: user.isActive,
        lastLogout: user.lastLogout,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging out" });
  }
};

// Get Me
exports.getMe = async (req, res) => {
  const user = req.user;

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    lastLogout: user.lastLogout,
    dob: user.dob,
    phone: user.phone || "",
    country: user.country || "",
    state: user.state || "",
    city: user.city || "",
    postalCode: user.postalCode || "",
  });
};


// Update User Info (phone, dob, location, etc.)
exports.updateUserData = async (req, res) => {
  const {
    name,
    gender,
    dob,
    phone,
    country,
    state,
    city,
    postalCode,
  } = req.body;
console.log(req.body);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name !== undefined && { name }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dob }),
        ...(phone !== undefined && { phone }),
        ...(country !== undefined && { country }),
        ...(state !== undefined && { state }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode }),
        // ❌ Do NOT include `email` in updates
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        email: updatedUser.email, // returned but not updatable
        gender: updatedUser.gender,
        dob: updatedUser.dob,
        phone: updatedUser.phone,
        country: updatedUser.country,
        state: updatedUser.state,
        city: updatedUser.city,
        postalCode: updatedUser.postalCode,
      },
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

// Delete Account - Authenticated user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Account deleted successfully",
      userId: deletedUser._id
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};
