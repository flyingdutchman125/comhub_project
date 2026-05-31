const db = require('../config/db');

// Get notifications untuk user dengan filter
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { categoryId, typeId, isRead, limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT 
                n.id, n.user_id, n.community_id, n.type_id, n.title, n.message,
                n.is_read, n.read_at, n.created_at, n.data,
                c.nama_komunitas as community_name,
                ct.name as type_name,
                nc.name as category_name
            FROM notifications n
            JOIN communities c ON n.community_id = c.id
            JOIN notification_types ct ON n.type_id = ct.id
            JOIN notification_categories nc ON ct.category_id = nc.id
            WHERE n.user_id = ?
        `;
        
        const params = [userId];

        if (categoryId) {
            query += ` AND nc.id = ?`;
            params.push(categoryId);
        }

        if (typeId) {
            query += ` AND ct.id = ?`;
            params.push(typeId);
        }

        if (isRead !== undefined) {
            query += ` AND n.is_read = ?`;
            params.push(isRead === 'true' ? 1 : 0);
        }

        query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [notifications] = await db.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total FROM notifications n
            JOIN notification_types ct ON n.type_id = ct.id
            JOIN notification_categories nc ON ct.category_id = nc.id
            WHERE n.user_id = ?
        `;
        const countParams = [userId];

        if (categoryId) {
            countQuery += ` AND nc.id = ?`;
            countParams.push(categoryId);
        }

        if (typeId) {
            countQuery += ` AND ct.id = ?`;
            countParams.push(typeId);
        }

        if (isRead !== undefined) {
            countQuery += ` AND n.is_read = ?`;
            countParams.push(isRead === 'true' ? 1 : 0);
        }

        const [countResult] = await db.query(countQuery, countParams);

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: {
                total: countResult[0].total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Error getting notifications:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi' });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { categoryId } = req.query;

        let query = `
            SELECT 
                COALESCE(nc.id, 0) as category_id,
                nc.name as category_name,
                COUNT(n.id) as unread_count
            FROM notification_categories nc
            LEFT JOIN notification_types ct ON nc.id = ct.category_id
            LEFT JOIN notifications n ON ct.id = n.type_id AND n.user_id = ? AND n.is_read = 0
        `;

        const params = [userId];

        if (categoryId) {
            query += ` WHERE nc.id = ?`;
            params.push(categoryId);
        }

        query += ` GROUP BY nc.id, nc.name`;

        const [results] = await db.query(query, params);

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error getting unread count:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil jumlah notifikasi belum dibaca' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const [notification] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (notification.length === 0) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }

        await db.query(
            'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
            [notificationId]
        );

        res.status(200).json({
            success: true,
            message: 'Notifikasi berhasil ditandai sebagai sudah dibaca'
        });

    } catch (error) {
        console.error('Error marking notification as read:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menandai notifikasi sebagai dibaca' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { categoryId } = req.body;

        let query = `
            UPDATE notifications n
            JOIN notification_types ct ON n.type_id = ct.id
            JOIN notification_categories nc ON ct.category_id = nc.id
            SET n.is_read = 1, n.read_at = NOW()
            WHERE n.user_id = ? AND n.is_read = 0
        `;
        const params = [userId];

        if (categoryId) {
            query += ` AND nc.id = ?`;
            params.push(categoryId);
        }

        await db.query(query, params);

        res.status(200).json({
            success: true,
            message: 'Semua notifikasi berhasil ditandai sebagai sudah dibaca'
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menandai semua notifikasi sebagai dibaca' });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const [notification] = await db.query(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (notification.length === 0) {
            return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
        }

        await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

        res.status(200).json({
            success: true,
            message: 'Notifikasi berhasil dihapus'
        });

    } catch (error) {
        console.error('Error deleting notification:', error.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus notifikasi' });
    }
};

// Get notification categories
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT 
                nc.id, nc.name, nc.description, nc.icon,
                COUNT(ct.id) as types_count
            FROM notification_categories nc
            LEFT JOIN notification_types ct ON nc.id = ct.category_id
            GROUP BY nc.id
            ORDER BY nc.name
        `);

        res.status(200).json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Error getting categories:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil kategori notifikasi' });
    }
};

// Get notification types by category
exports.getTypesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const [types] = await db.query(`
            SELECT * FROM notification_types 
            WHERE category_id = ?
            ORDER BY name
        `, [categoryId]);

        res.status(200).json({
            success: true,
            data: types
        });

    } catch (error) {
        console.error('Error getting types:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil tipe notifikasi' });
    }
};

// Internal function: Create notification
exports.createNotification = async (userId, communityId, typeId, title, message, data = null) => {
    try {
        await db.query(
            `INSERT INTO notifications (user_id, community_id, type_id, title, message, data)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, communityId, typeId, title, message, data ? JSON.stringify(data) : null]
        );
        return true;
    } catch (error) {
        console.error('Error creating notification:', error.message);
        return false;
    }
};

// Broadcast notification to multiple users
exports.broadcastNotification = async (userIds, communityId, typeId, title, message, data = null) => {
    try {
        const values = userIds.map(userId => [
            userId, communityId, typeId, title, message, data ? JSON.stringify(data) : null
        ]);

        await db.query(
            `INSERT INTO notifications (user_id, community_id, type_id, title, message, data)
             VALUES ?`,
            [values]
        );
        return true;
    } catch (error) {
        console.error('Error broadcasting notification:', error.message);
        return false;
    }
};
