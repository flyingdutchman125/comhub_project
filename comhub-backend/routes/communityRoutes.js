const express = require('express');
const router = express.Router();
// Pastikan fungsi baru di-import
const {
    createCommunity,
    getAllCommunities,
    getUserCommunities,
    getCommunityById,
    generateReport,
    getTopCommunities,
    getPopularCommunities,
    updateMemberRating,
    updateCommunity,
    addOrUpdateReview,
    getCommunityReviews
} = require('../controllers/communityController');

const {
    joinCommunity,
    getApplicants,
    approveApplicant,
    assignRole,
    removeMember,
    getCommunityMembers,
    resignFromKetua
} = require('../controllers/communityMemberController');

const {
    getPendingCommunities,
    approveByDosen,
    setInterviewDate,
    approveByKemahasiswaan,
    rejectCommunity,
    applyForUKMUpgrade,
    approveUpgradeDosen,
    approveUpgradeKemahasiswaan,
    rejectUpgradeKemahasiswaan,
    getPendingUKMActivities,
    approveProject,
    rejectProject,
    approveFinance,
    rejectFinance
} = require('../controllers/communityApprovalController');

const { verifyToken } = require('../middleware/authMiddleware');

// PENTING: Route /my dan /top harus di atas /:id agar tidak tertangkap sebagai parameter
router.get('/my', verifyToken, getUserCommunities);
router.get('/top', getTopCommunities);
router.get('/popular', getPopularCommunities);
router.get('/pending/approvals', verifyToken, getPendingCommunities);
router.get('/pending/ukm-activities', verifyToken, getPendingUKMActivities);

router.get('/', getAllCommunities);
router.post('/', verifyToken, createCommunity);
router.get('/:id', verifyToken, getCommunityById);
router.put('/:id', verifyToken, updateCommunity);
router.post('/:id/join', verifyToken, joinCommunity);

// Approval Routes (DOSEN & KEMAHASISWAAN)
router.put('/:id/approve/dosen', verifyToken, approveByDosen);
router.put('/:id/interview', verifyToken, setInterviewDate);
router.put('/:id/approve/kemahasiswaan', verifyToken, approveByKemahasiswaan);
router.put('/:id/reject', verifyToken, rejectCommunity);

// Upgrade Routes
router.post('/:id/upgrade', verifyToken, applyForUKMUpgrade);
router.put('/:id/upgrade/approve', verifyToken, approveUpgradeDosen);
router.put('/:id/upgrade/approve/kemahasiswaan', verifyToken, approveUpgradeKemahasiswaan);
router.put('/:id/upgrade/reject/kemahasiswaan', verifyToken, rejectUpgradeKemahasiswaan);

// UKM Activity Approval Routes (DOSEN)
router.put('/projects/:id/approve', verifyToken, approveProject);
router.put('/projects/:id/reject', verifyToken, rejectProject);
router.put('/finances/:id/approve', verifyToken, approveFinance);
router.put('/finances/:id/reject', verifyToken, rejectFinance);

// TAMBAHAN BARU:
// Endpoint untuk mengundurkan diri (Hanya KETUA)
router.put('/:id/members/resign', verifyToken, resignFromKetua);

// Endpoint untuk melihat daftar anggota aktif di komunitas
router.get('/:id/members', verifyToken, getCommunityMembers);

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

// Endpoint untuk memberikan rating keaktifan anggota (PUT /api/communities/1/members/2/rating) - Hanya Ketua
router.put('/:id/members/:userId/rating', verifyToken, updateMemberRating);

// Endpoint untuk ulasan dan rating komunitas
router.post('/:id/reviews', verifyToken, addOrUpdateReview);
router.get('/:id/reviews', getCommunityReviews);

module.exports = router;