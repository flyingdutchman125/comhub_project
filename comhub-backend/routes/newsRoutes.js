const express = require('express');
const router = express.Router();
const {
    getAllNews,
    createNews,
    updateNews,
    deleteNews
} = require('../controllers/newsController');
const { verifyToken } = require('../middleware/authMiddleware');

// Custom middleware to verify that the user's role is KEMAHASISWAAN (Super Admin)
const verifySuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'KEMAHASISWAAN') {
        return res.status(403).json({ message: 'Akses ditolak! Hanya Admin Kemahasiswaan yang diizinkan.' });
    }
    next();
};

// Routes definition
router.get('/', verifyToken, getAllNews);
router.post('/', verifyToken, verifySuperAdmin, createNews);
router.put('/:id', verifyToken, verifySuperAdmin, updateNews);
router.delete('/:id', verifyToken, verifySuperAdmin, deleteNews);

module.exports = router;
