const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get all notifications
router.get('/', verifyToken, notificationController.getNotifications);

// Get unread count
router.get('/unread/count', verifyToken, notificationController.getUnreadCount);

// Get categories
router.get('/categories', verifyToken, notificationController.getCategories);

// Get types by category
router.get('/categories/:categoryId/types', verifyToken, notificationController.getTypesByCategory);

// Mark notification as read
router.put('/:notificationId/read', verifyToken, notificationController.markAsRead);

// Mark all as read
router.put('/read-all', verifyToken, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', verifyToken, notificationController.deleteNotification);

module.exports = router;
