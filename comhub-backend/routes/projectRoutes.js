const express = require('express');
const router = express.Router();
const { createProject, createTask, updateTaskStatus, getProjectBoard } = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint: Membuat Proker di suatu komunitas
router.post('/communities/:communityId/projects', verifyToken, createProject);

// Endpoint: Membuat Tugas di dalam Proker
router.post('/projects/:projectId/tasks', verifyToken, createTask);

// Endpoint: Mengubah status tugas (geser kartu Kanban)
router.put('/tasks/:taskId/status', verifyToken, updateTaskStatus);

// Endpoint: Melihat Kanban Board & Progress Bar
router.get('/projects/:projectId/board', verifyToken, getProjectBoard);

module.exports = router;