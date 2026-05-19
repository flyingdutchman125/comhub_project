const express = require('express');
const router = express.Router();
const { createFinance, updateFinance, deleteFinance } = require('../controllers/financeController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: Menambah transaksi ke komunitas
router.post('/communities/:id/finances', verifyToken, createFinance);

// Endpoint: Mengubah transaksi
router.put('/finances/:financeId', verifyToken, updateFinance);

// Endpoint: Menghapus transaksi
router.delete('/finances/:financeId', verifyToken, deleteFinance);

module.exports = router;
