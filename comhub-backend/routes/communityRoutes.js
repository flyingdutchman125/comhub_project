const express = require('express');
const router = express.Router();
// Pastikan fungsi baru di-import
const {
    createCommunity,
    getAllCommunities,
    joinCommunity,
    getApplicants,
    approveApplicant,
    assignRole
} = require('../controllers/communityController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', getAllCommunities);
router.post('/', verifyToken, createCommunity);
router.post('/:id/join', verifyToken, joinCommunity);

// TAMBAHAN BARU:
// Endpoint untuk melihat pendaftar (GET /api/communities/1/applicants)
router.get('/:id/applicants', verifyToken, getApplicants);

// Endpoint untuk menerima pendaftar (PUT /api/communities/1/applicants/2/approve)
// Angka 1 = ID komunitas, Angka 2 = ID user pendaftar (Ahmad)
router.put('/:id/applicants/:userId/approve', verifyToken, approveApplicant);
router.put('/:id/members/:userId/role', verifyToken, assignRole);

module.exports = router;