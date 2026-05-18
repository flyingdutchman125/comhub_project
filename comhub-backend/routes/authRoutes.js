const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: POST /api/auth/register
router.post('/register', register);

// Endpoint: POST /api/auth/login
router.post('/login', login);

// Endpoint: POST /api/auth/logout
router.post('/logout', verifyToken, logout);

module.exports = router;