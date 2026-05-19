const express = require('express');
const router = express.Router();
// Pastikan fungsi baru di-import
const {
    createCommunity,
    getAllCommunities,
    getUserCommunities,
    getCommunityById,
    joinCommunity,
    getApplicants,
    approveApplicant,
    assignRole,
    removeMember,
    generateReport
} = require('../controllers/communityController');
const { verifyToken } = require('../middleware/authMiddleware');

// PENTING: Route /my harus di atas /:id agar tidak tertangkap sebagai parameter
router.get('/my', verifyToken, getUserCommunities);

router.get('/', getAllCommunities);
router.post('/', verifyToken, createCommunity);
router.get('/:id', verifyToken, getCommunityById);
router.post('/:id/join', verifyToken, joinCommunity);

// TAMBAHAN BARU:
// Endpoint untuk melihat pendaftar (GET /api/communities/1/applicants)
router.get('/:id/applicants', verifyToken, getApplicants);

// Endpoint untuk menerima pendaftar (PUT /api/communities/1/applicants/2/approve)
// Angka 1 = ID komunitas, Angka 2 = ID user pendaftar (Ahmad)
router.put('/:id/applicants/:userId/approve', verifyToken, approveApplicant);
router.put('/:id/members/:userId/role', verifyToken, assignRole);

// Endpoint untuk menghapus anggota (DELETE /api/communities/1/members/2)
router.delete('/:id/members/:userId', verifyToken, removeMember);

// Endpoint untuk ekspor laporan (GET /api/communities/1/report) - Hanya Ketua
router.get('/:id/report', verifyToken, generateReport);

module.exports = router;