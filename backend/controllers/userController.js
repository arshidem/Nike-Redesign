const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
// Helper function to format user response
const formatUserResponse = (user) => ({
  _id: user._id,
  email: user.email,
  name: user.name,
  gender: user.gender,
  role: user.role,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  lastLogout: user.lastLogout,
  profilePicture: user.profilePicture,
  phoneNumber: user.phoneNumber,
  preferences: user.preferences,
  hasOtp: !!user.otp,
  isVerified: !!user.name && !!user.gender,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  status: !user.isActive ? 'inactive' : (!user.name || !user.gender) ? 'pending' : 'active'
});

// @desc    Get all users with filtering, sorting, and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sortBy, role, gender, status, isActive } = req.query;

  const query = {};

  // Search by name or email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Apply filters
  if (role) query.role = role;
  if (gender) query.gender = gender;
  if (status) query.status = status;
  if (isActive !== undefined) query.isActive = isActive === "true";

  // Sorting
  let sort = {};
  if (sortBy) {
    const [field, order] = sortBy.split(":");
    sort[field] = order === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  const skip = (Number(page) - 1) * Number(limit);
  const totalDocs = await User.countDocuments(query);
  const users = await User.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .select("-password") // Exclude password
    .lean(); // Faster query

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: Number(page),
      hasNextPage: skip + users.length < totalDocs,
      hasPrevPage: skip > 0,
    },
  });
});

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-otp -otpExpires -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update user profile data
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUserData = asyncHandler(async (req, res) => {
  try {
    const { 
      name, 
      gender, 
      email, 
      phoneNumber,
      profilePicture,
      preferences,
      isActive // Allow admin to manually set active status
    } = req.body;

    // Email uniqueness check
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account'
        });
      }
    }

    // Phone number validation
    if (phoneNumber && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{3,6}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-otp -otpExpires -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: formatUserResponse(user)
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role (user, admin) is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-otp -otpExpires -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { id: req.params.id }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// DELETE /api/users/bulk-delete
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body; // array of user IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No user IDs provided" });
    }

    const result = await User.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} user(s) deleted`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// PATCH /api/users/bulk-role
// controllers/userController.js
exports.bulkUpdateUserRole = async (req, res) => {
  try {
    const { ids, role } = req.body;  // Note 'ids' not 'userIds'

    // Validate input
    if (!ids || !role) {
      return res.status(400).json({
        success: false,
        message: "Both 'ids' and 'role' are required"
      });
    }

    // Validate all IDs
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid user IDs: ${invalidIds.join(', ')}`
      });
    }

    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can update roles"
      });
    }

    // Perform update
    const result = await User.updateMany(
      { _id: { $in: ids } },
      { $set: { role } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} users to ${role} role`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Bulk role update error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk update",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// @desc    Get user activity stats
// @route   GET /api/admin/users/activity/stats
// @access  Private/Admin
exports.getUserActivityStats = asyncHandler(async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          inactiveUsers: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } },
          pendingUsers: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ["$name", null] },
                  { $eq: ["$name", undefined] },
                  { $eq: ["$gender", null] },
                  { $eq: ["$gender", undefined] }
                ] },
                1,
                0
              ]
            }
          },
          latestLogin: { $max: "$lastLogin" },
          latestActivity: { $max: ["$lastLogin", "$lastLogout"] }
        }
      },
      { $project: { _id: 0 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingUsers: 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user activity stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});