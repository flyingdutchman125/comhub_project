const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

// Terapkan middleware auth pada semua rute message
router.use(verifyToken);

// Endpoint pesan
router.post('/', messageController.sendMessage);
router.get('/inbox', messageController.getInbox);
router.put('/:id/read', messageController.markAsRead);
router.post('/:id/accept-promotion', messageController.acceptPromotionOffer);
router.post('/:id/reject-promotion', messageController.rejectPromotionOffer);

module.exports = router;
