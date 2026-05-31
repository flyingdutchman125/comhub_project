const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get community tasks
router.get('/community/:communityId', verifyToken, taskController.getCommunitytasks);

// Get my tasks
router.get('/my/all', verifyToken, taskController.getMyTasks);

// Create task
router.post('/:communityId', verifyToken, taskController.createTask);

// Update task status
router.put('/:taskId/status', verifyToken, taskController.updateTaskStatus);

// Add note to task
router.put('/:taskId/note', verifyToken, taskController.addTaskNote);

// Delete task
router.delete('/:taskId', verifyToken, taskController.deleteTask);

module.exports = router;
