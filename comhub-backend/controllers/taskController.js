const db = require('../config/db');
const notificationController = require('./notificationController');

// Get all tasks for community
exports.getCommunitytasks = async (req, res) => {
    try {
        const { communityId } = req.params;
        const { status, priority, limit = 10, offset = 0 } = req.query;
        const userId = req.user.id;

        // Check if user is member of community
        const [isMember] = await db.query(
            `SELECT * FROM community_members WHERE community_id = ? AND user_id = ?`,
            [communityId, userId]
        );

        if (isMember.length === 0) {
            return res.status(403).json({ message: 'Anda bukan anggota komunitas ini' });
        }

        let query = `
            SELECT 
                t.id, t.community_id, t.assigned_by, t.title, t.description, 
                t.priority, t.status, t.due_date, t.created_at, t.updated_at,
                u.nama as assigned_by_name,
                COUNT(DISTINCT ta.id) as assigned_count
            FROM tasks t
            JOIN users u ON t.assigned_by = u.id
            LEFT JOIN task_assignments ta ON t.id = ta.task_id
            WHERE t.community_id = ?
        `;

        const params = [communityId];

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }

        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }

        query += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [tasks] = await db.query(query, params);

        // Get count
        let countQuery = `SELECT COUNT(DISTINCT t.id) as total FROM tasks t WHERE t.community_id = ?`;
        const countParams = [communityId];

        if (status) {
            countQuery += ` AND t.status = ?`;
            countParams.push(status);
        }

        if (priority) {
            countQuery += ` AND t.priority = ?`;
            countParams.push(priority);
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.status(200).json({
            success: true,
            data: tasks,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error getting tasks:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil tugas' });
    }
};

// Get my tasks (tasks assigned to me)
exports.getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, communityId, limit = 10, offset = 0 } = req.query;

        let query = `
            SELECT 
                t.id, t.community_id, t.assigned_by, t.title, t.description,
                t.priority, t.status, t.due_date, t.created_at, t.updated_at,
                c.nama_komunitas as community_name,
                u.nama as assigned_by_name,
                ta.assigned_at, ta.completed_at, ta.notes
            FROM tasks t
            JOIN task_assignments ta ON t.id = ta.task_id
            JOIN communities c ON t.community_id = c.id
            JOIN users u ON t.assigned_by = u.id
            WHERE ta.user_id = ?
        `;

        const params = [userId];

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }

        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }

        if (communityId) {
            query += ` AND t.community_id = ?`;
            params.push(communityId);
        }

        query += ` ORDER BY t.due_date ASC, t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [tasks] = await db.query(query, params);

        // Get count
        let countQuery = `
            SELECT COUNT(DISTINCT t.id) as total FROM tasks t
            JOIN task_assignments ta ON t.id = ta.task_id
            WHERE ta.user_id = ?
        `;
        const countParams = [userId];

        if (status) {
            countQuery += ` AND t.status = ?`;
            countParams.push(status);
        }

        if (priority) {
            countQuery += ` AND t.priority = ?`;
            countParams.push(priority);
        }

        if (communityId) {
            countQuery += ` AND t.community_id = ?`;
            countParams.push(communityId);
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.status(200).json({
            success: true,
            data: tasks,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error getting my tasks:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil tugas saya' });
    }
};

// Create task
exports.createTask = async (req, res) => {
    try {
        const { communityId } = req.params;
        const { title, description, priority = 'MEDIUM', due_date, assignToUsers = [] } = req.body;
        const assignedBy = req.user.id;

        // Verify user is KETUA or similar authority
        const [authority] = await db.query(
            `SELECT * FROM community_members 
             WHERE community_id = ? AND user_id = ? 
             AND community_role IN ('KETUA', 'SEKRETARIS', 'BENDAHARA')`,
            [communityId, assignedBy]
        );

        if (authority.length === 0) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk membuat tugas' });
        }

        // Create task
        const [taskResult] = await db.query(
            `INSERT INTO tasks (community_id, assigned_by, title, description, priority, due_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [communityId, assignedBy, title, description, priority, due_date || null]
        );

        const taskId = taskResult.insertId;

        // Assign to users
        if (assignToUsers.length > 0) {
            const values = assignToUsers.map(userId => [taskId, userId]);
            await db.query(
                `INSERT INTO task_assignments (task_id, user_id) VALUES ?`,
                [values]
            );

            // Send notifications
            const [notificationType] = await db.query(
                `SELECT id FROM notification_types 
                 JOIN notification_categories ON notification_types.category_id = notification_categories.id
                 WHERE notification_types.name = 'Task Assignment' LIMIT 1`
            );

            if (notificationType.length > 0) {
                await notificationController.broadcastNotification(
                    assignToUsers,
                    communityId,
                    notificationType[0].id,
                    `Tugas Baru: ${title}`,
                    `Anda telah ditugaskan untuk: ${description || title}`,
                    { taskId, dueDate: due_date, priority }
                );
            }
        }

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dibuat',
            data: { id: taskId, communityId, title, description, priority, due_date }
        });

    } catch (error) {
        console.error('Error creating task:', error.message);
        res.status(500).json({ success: false, message: 'Gagal membuat tugas' });
    }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ message: 'Status tidak valid' });
        }

        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);

        if (task.length === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan' });
        }

        // Verify user is assigned or is the one who assigned
        const [assignment] = await db.query(
            `SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?`,
            [taskId, userId]
        );

        if (assignment.length === 0 && task[0].assigned_by !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin mengubah tugas ini' });
        }

        await db.query(
            `UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?`,
            [status, taskId]
        );

        if (status === 'COMPLETED' && assignment.length > 0) {
            await db.query(
                `UPDATE task_assignments SET completed_at = NOW() WHERE task_id = ? AND user_id = ?`,
                [taskId, userId]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Status tugas berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error updating task status:', error.message);
        res.status(500).json({ success: false, message: 'Gagal memperbarui status tugas' });
    }
};

// Add note to task assignment
exports.addTaskNote = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { notes } = req.body;
        const userId = req.user.id;

        const [assignment] = await db.query(
            `SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?`,
            [taskId, userId]
        );

        if (assignment.length === 0) {
            return res.status(404).json({ message: 'Anda tidak ditugaskan untuk tugas ini' });
        }

        await db.query(
            `UPDATE task_assignments SET notes = ? WHERE task_id = ? AND user_id = ?`,
            [notes, taskId, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Catatan berhasil ditambahkan'
        });

    } catch (error) {
        console.error('Error adding task note:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menambahkan catatan' });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);

        if (task.length === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan' });
        }

        if (task[0].assigned_by !== userId) {
            return res.status(403).json({ message: 'Hanya pembuat tugas yang dapat menghapusnya' });
        }

        await db.query('DELETE FROM tasks WHERE id = ?', [taskId]);

        res.status(200).json({
            success: true,
            message: 'Tugas berhasil dihapus'
        });

    } catch (error) {
        console.error('Error deleting task:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus tugas' });
    }
};
