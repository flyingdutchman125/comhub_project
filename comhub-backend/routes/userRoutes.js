const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getPortfolio,
    getMyTasks,
    submitTask,
    getTaskSubmissions,
    downloadSubmission,
    reviewSubmission
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Profil
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// Portofolio
router.get('/portfolio', verifyToken, getPortfolio);

// My Tasks (to-do list anggota)
router.get('/tasks', verifyToken, getMyTasks);

// Task Submission
router.post('/tasks/:taskId/submit', verifyToken, submitTask);
router.get('/tasks/:taskId/submissions', verifyToken, getTaskSubmissions);
router.get('/submissions/:submissionId/download', verifyToken, downloadSubmission);
router.put('/submissions/:submissionId/review', verifyToken, reviewSubmission);

module.exports = router;
