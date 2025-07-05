const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Admin user management routes
// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/users', verifyAdmin, userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get a single user by ID (Admin only)
router.get('/users/:id', verifyAdmin, userController.getUserById);

// @route   PUT /api/users/:id
// @desc    Update user data (Admin only)
router.put('/users/:id', verifyAdmin, userController.updateUserData);

// @route   DELETE /api/users/:id
// @desc    Delete a user (Admin only)
router.delete('/users/:id', verifyAdmin, userController.deleteUser);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
router.put('/users/:id/role', verifyAdmin, userController.updateUserRole);

// @route   GET /api/users/activity/stats
// @desc    Get user activity statistics (Admin only)
router.get('/users/activity/stats', verifyAdmin, userController.getUserActivityStats);

module.exports = router;