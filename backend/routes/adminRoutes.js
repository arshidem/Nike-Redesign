const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Admin user management routes

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
router.get('/users', verifyAdmin, userController.getUsers);

// @route   GET /api/admin/users/activity/stats
// @desc    Get user activity statistics (Admin only)
router.get('/users/activity/stats', verifyAdmin, userController.getUserActivityStats);

// Bulk operations routes
// @route   PUT /api/admin/users/bulk/role
// @desc    Bulk update user roles (Admin only)
router.put('/users/bulk/role', verifyAdmin, userController.bulkUpdateUserRole);

// @route   DELETE /api/admin/users/bulk
// @desc    Bulk delete users (Admin only)
router.delete('/users/bulk', verifyAdmin, userController.bulkDeleteUsers);

// Single user operations
// @route   GET /api/admin/users/:id
// @desc    Get a single user by ID (Admin only)
router.get('/users/:id', verifyAdmin, userController.getUserById);

// @route   PUT /api/admin/users/:id
// @desc    Update user data (Admin only)
router.put('/users/:id', verifyAdmin, userController.updateUserData);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user (Admin only)
router.delete('/users/:id', verifyAdmin, userController.deleteUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Admin only)
router.put('/users/:id/role', verifyAdmin, userController.updateUserRole);

module.exports = router;