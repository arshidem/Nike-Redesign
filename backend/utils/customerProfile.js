// An explicit projection keeps credentials and internal OTP fields out of responses.
module.exports = (user) => ({
  _id: user._id,
  name: user.name || "",
  email: user.email,
  gender: user.gender,
  role: user.role,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  lastLogout: user.lastLogout,
  dob: user.dob || "",
  phone: user.phone || "",
  country: user.country || "",
  state: user.state || "",
  city: user.city || "",
  postalCode: user.postalCode || "",
  createdAt: user.createdAt,
  preferences: {
    notifications: { email: user.preferences?.notifications?.email ?? true },
  },
});
