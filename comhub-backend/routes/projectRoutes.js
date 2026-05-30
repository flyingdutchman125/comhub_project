const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjectsByCommunity,
    updateProject,
    deleteProject,
    createTask,
    updateTaskStatus,
    getProjectBoard,
    getProjectDiscussions,
    addProjectDiscussion,
    editProjectDiscussion,
    deleteProjectDiscussion,
    markDiscussionAsRead
} = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: Melihat semua Proyek di suatu komunitas
router.get('/communities/:communityId/projects', verifyToken, getProjectsByCommunity);

// Endpoint: Membuat Proker di suatu komunitas
router.post('/communities/:communityId/projects', verifyToken, createProject);

// Endpoint: Mengubah Proyek
router.put('/projects/:projectId', verifyToken, updateProject);

// Endpoint: Menghapus Proyek
router.delete('/projects/:projectId', verifyToken, deleteProject);

// Endpoint: Membuat Tugas di dalam Proker
router.post('/projects/:projectId/tasks', verifyToken, createTask);

// Endpoint: Mengubah status tugas (geser kartu Kanban)
router.put('/tasks/:taskId/status', verifyToken, updateTaskStatus);

// Endpoint: Melihat Kanban Board & Progress Bar
router.get('/projects/:projectId/board', verifyToken, getProjectBoard);

// Endpoint: Melihat Diskusi Forum Proyek
router.get('/projects/:projectId/discussions', verifyToken, getProjectDiscussions);

// Endpoint: Mengirim Pesan Diskusi Forum Proyek
router.post('/projects/:projectId/discussions', verifyToken, addProjectDiscussion);

// Endpoint: Edit Pesan Diskusi Forum Proyek
router.put('/projects/:projectId/discussions/:messageId', verifyToken, editProjectDiscussion);

// Endpoint: Hapus Pesan Diskusi Forum Proyek
router.delete('/projects/:projectId/discussions/:messageId', verifyToken, deleteProjectDiscussion);

// Endpoint: Mark Messages as Read
router.post('/projects/:projectId/discussions/read', verifyToken, markDiscussionAsRead);

module.exports = router;