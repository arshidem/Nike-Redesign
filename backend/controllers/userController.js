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
exports.getUsers = asyncHandler(async (req, res) => {
  try {
    // Extract and validate query parameters
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      gender, 
      status, // New status filter (active/inactive/pending)
      sortBy = 'createdAt:desc',
      hasOtp,
      verified,
      createdAfter,
      createdBefore,
      isActive // New isActive filter
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Build filter object
    const filter = {};
    
    // Text search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } } // Added phone number search
      ];
    }
    
    // Exact match filters
    if (role) filter.role = role;
    if (gender) filter.gender = gender;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // Status filter (active/inactive/pending)
    if (status) {
      if (status === 'active') {
        filter.isActive = true;
        filter.$and = [
          { name: { $exists: true, $ne: null } },
          { gender: { $exists: true, $ne: null } }
        ];
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else if (status === 'pending') {
        filter.$or = [
          { name: { $exists: false } },
          { name: null },
          { gender: { $exists: false } },
          { gender: null }
        ];
      }
    }
    
    // OTP status filter
    if (hasOtp === 'true') {
      filter.otp = { $exists: true, $ne: null };
    } else if (hasOtp === 'false') {
      filter.otp = { $exists: false };
    }

    // Verification status filter
    if (verified === 'true') {
      filter.$and = [
        { name: { $exists: true, $ne: null } },
        { gender: { $exists: true, $ne: null } }
      ];
    } else if (verified === 'false') {
      filter.$or = [
        { name: { $exists: false } },
        { name: null },
        { gender: { $exists: false } },
        { gender: null }
      ];
    }

    // Date range filters
    const dateFilters = {};
    if (createdAfter) dateFilters.$gte = new Date(createdAfter);
    if (createdBefore) dateFilters.$lte = new Date(createdBefore);
    if (Object.keys(dateFilters).length) filter.createdAt = dateFilters;

    // Last activity filters
    if (req.query.lastLoginAfter) {
      filter.lastLogin = { $gte: new Date(req.query.lastLoginAfter) };
    }
    if (req.query.lastLoginBefore) {
      filter.lastLogin = { ...filter.lastLogin, $lte: new Date(req.query.lastLoginBefore) };
    }

    // Parse sorting
    const [sortField, sortOrder] = sortBy.split(':');
    const sort = {};
    const validSortFields = ['createdAt', 'name', 'email', 'updatedAt', 'lastLogin', 'lastLogout'];
    const validOrder = ['asc', 'desc'];
    
    if (validSortFields.includes(sortField) && validOrder.includes(sortOrder)) {
      sort[sortField] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    // Get total count and paginated results in parallel
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-otp -otpExpires -__v -password')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort(sort)
        .lean()
    ]);

    // Format response
    const response = {
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users.map(formatUserResponse)
    };

    res.set('Cache-Control', 'public, max-age=60');
    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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