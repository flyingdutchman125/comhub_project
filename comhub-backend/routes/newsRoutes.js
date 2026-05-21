const express = require('express');
const router = express.Router();
const {
    getAllNews,
    createNews,
    updateNews,
    deleteNews
} = require('../controllers/newsController');
const { verifyToken } = require('../middleware/authMiddleware');

// Routes definition
router.get('/', verifyToken, getAllNews);
router.post('/', verifyToken, createNews);
router.put('/:id', verifyToken, updateNews);
router.delete('/:id', verifyToken, deleteNews);

module.exports = router;
