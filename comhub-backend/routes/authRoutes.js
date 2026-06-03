const express = require('express');
const router = express.Router();
const { register, login, logout, changePassword, registerAdmin } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: POST /api/auth/register
router.post('/register', register);

// Endpoint: POST /api/auth/register-admin
router.post('/register-admin', verifyToken, registerAdmin);

// Endpoint: POST /api/auth/login
router.post('/login', login);

// Endpoint: POST /api/auth/logout
router.post('/logout', verifyToken, logout);

// Endpoint: PUT /api/auth/change-password
router.put('/change-password', verifyToken, changePassword);

module.exports = router;