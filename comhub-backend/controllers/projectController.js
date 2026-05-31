const db = require('../config/db');

// --- FITUR MEMBUAT PROKER BARU ---
const createProject = async (req, res) => {
    const communityId = req.params.communityId;
    const userId = req.user.id;
    const { nama_proyek, deskripsi, anggaran, start_date, end_date } = req.body; // tetep nama_proyek dari frontend

    try {
        // Otorisasi: Pastikan user adalah pengurus
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa membuat proyek.' });
        }

        const [result] = await db.query(
            'INSERT INTO projects (community_id, nama_proker, deskripsi, anggaran, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
            [communityId, nama_proyek, deskripsi, anggaran || '0', start_date, end_date]
        );
        res.status(201).json({ message: 'Proyek berhasil dibuat!', projectId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat proyek.' });
    }
};

// --- FITUR MELIHAT SEMUA PROYEK DALAM KOMUNITAS ---
const getProjectsByCommunity = async (req, res) => {
    const communityId = req.params.communityId;

    try {
        const [projects] = await db.query(`
            SELECT p.id, p.nama_proker as name, p.deskripsi, p.anggaran, p.progress, p.start_date, p.end_date, p.created_at,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as totalTasks,
                (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as doneTasks
            FROM projects p
            WHERE p.community_id = ?
            ORDER BY p.created_at DESC
        `, [communityId]);

        // Hitung progress dan format data
        const formatted = projects.map(p => ({
            id: p.id,
            name: p.name,
            deskripsi: p.deskripsi,
            anggaran: p.anggaran,
            start_date: p.start_date,
            end_date: p.end_date,
            created_at: p.created_at,
            totalTasks: p.totalTasks,
            doneTasks: p.doneTasks,
            progress: p.progress || 0, // Menggunakan kolom progress manual
            status: p.progress === 100 ? 'Done'
                : p.progress >= 50 ? 'On Track'
                : p.progress > 0 ? 'At Risk'
                : 'Planning'
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data proyek.' });
    }
};

// --- FITUR MENGUBAH PROYEK ---
const updateProject = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { nama_proyek, deskripsi, anggaran, progress, start_date, end_date } = req.body;

    try {
        // 1. Ambil project untuk mendapatkan community_id
        const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (project.length === 0) {
            return res.status(404).json({ message: 'Proyek tidak ditemukan.' });
        }

        const communityId = project[0].community_id;

        // 2. Otorisasi
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa mengubah proyek.' });
        }

        // 3. Update proyek
        await db.query(
            'UPDATE projects SET nama_proker = ?, deskripsi = ?, anggaran = ?, progress = ?, start_date = ?, end_date = ? WHERE id = ?',
            [nama_proyek, deskripsi, anggaran || '0', progress || 0, start_date, end_date, projectId]
        );

        res.status(200).json({ message: 'Proyek berhasil diperbarui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengubah proyek.' });
    }
};

// --- FITUR MENGHAPUS PROYEK ---
const deleteProject = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id;

    try {
        // 1. Ambil project untuk mendapatkan community_id
        const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (project.length === 0) {
            return res.status(404).json({ message: 'Proyek tidak ditemukan.' });
        }

        const communityId = project[0].community_id;

        // 2. Otorisasi
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua yang bisa menghapus proyek.' });
        }

        // 3. Hapus tasks terkait terlebih dahulu
        await db.query('DELETE FROM tasks WHERE project_id = ?', [projectId]);

        // 4. Hapus proyek
        await db.query('DELETE FROM projects WHERE id = ?', [projectId]);

        res.status(200).json({ message: 'Proyek berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus proyek.' });
    }
};

// --- FITUR MEMBUAT TUGAS BARU (TODO) ---
const createTask = async (req, res) => {
    const projectId = req.params.projectId;
    const { judul_tugas, deskripsi, assigned_to } = req.body;
    const userId = req.user.id; // Get creator's ID

    try {
        const [result] = await db.query(
            'INSERT INTO tasks (project_id, judul_tugas, deskripsi, assigned_to) VALUES (?, ?, ?, ?)',
            [projectId, judul_tugas, deskripsi, assigned_to]
        );

        if (assigned_to && assigned_to !== userId) {
            // Get project and creator info for notification
            const [projects] = await db.query('SELECT nama_proker FROM projects WHERE id = ?', [projectId]);
            const projectName = projects[0]?.nama_proker || 'Proyek';
            
            const [users] = await db.query('SELECT nama FROM users WHERE id = ?', [userId]);
            const userName = users[0]?.nama || 'Pengurus';

            await db.query(
                'INSERT INTO messages (sender_id, receiver_id, subject, content, type) VALUES (?, ?, ?, ?, ?)',
                [userId, assigned_to, 
                 `Tugas Baru: ${judul_tugas}`, 
                 `${userName} telah menugaskan Anda tugas baru "${judul_tugas}" pada proyek "${projectName}". Silakan cek Kotak Tugas Anda.`, 
                 'SYSTEM']
            );

            if (req.io) {
                req.io.to(`user_notifications_${assigned_to}`).emit('new_notification', {
                    title: `Tugas Baru: ${judul_tugas}`,
                    message: `Anda ditugaskan: ${judul_tugas} di ${projectName}`
                });
            }
        }

        res.status(201).json({ message: 'Tugas ditambahkan ke papan To Do!', taskId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat tugas.' });
    }
};

// --- FITUR MENGUBAH STATUS TUGAS (PINDAH KARTU KANBAN) ---
const updateTaskStatus = async (req, res) => {
    const taskId = req.params.taskId;
    const { status } = req.body; // 'TODO', 'IN_PROGRESS', atau 'DONE'

    try {
        const [result] = await db.query(
            'UPDATE tasks SET status = ? WHERE id = ?',
            [status, taskId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
        }
        res.status(200).json({ message: `Status tugas berhasil diubah menjadi ${status}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui status tugas.' });
    }
};

// --- FITUR MENGAMBIL DATA KANBAN BOARD (BESERTA PROGRESS BAR) ---
const getProjectBoard = async (req, res) => {
    const projectId = req.params.projectId;

    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE project_id = ?', [projectId]);

        // Menghitung persentase untuk fitur Progress Bar
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => t.status === 'DONE').length;
        const progressPercentage = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

        // Mengelompokkan tugas berdasarkan status untuk frontend
        const board = {
            TODO: tasks.filter(t => t.status === 'TODO'),
            IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
            DONE: tasks.filter(t => t.status === 'DONE'),
        };

        res.status(200).json({
            progressBar: `${progressPercentage}%`,
            board
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil papan proyek.' });
    }
};

// --- FITUR MENDAPATKAN DISKUSI PROYEK ---
const getProjectDiscussions = async (req, res) => {
    const projectId = req.params.projectId;

    try {
        const [discussions] = await db.query(`
            SELECT d.id, d.message, d.created_at, d.is_edited, u.nama as user_name, u.foto_profile, d.user_id
            FROM project_discussions d
            JOIN users u ON d.user_id = u.id
            WHERE d.project_id = ?
            ORDER BY d.created_at ASC
        `, [projectId]);

        if (discussions.length === 0) {
            return res.status(200).json([]);
        }

        const [reads] = await db.query(`
            SELECT r.message_id, u.nama 
            FROM project_discussion_reads r
            JOIN users u ON r.user_id = u.id
            WHERE r.message_id IN (SELECT id FROM project_discussions WHERE project_id = ?)
        `, [projectId]);

        const readMap = {};
        reads.forEach(r => {
            if (!readMap[r.message_id]) readMap[r.message_id] = [];
            readMap[r.message_id].push(r.nama);
        });

        const formatted = discussions.map(d => ({
            ...d,
            read_by: readMap[d.id] || []
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil diskusi proyek.' });
    }
};

// --- FITUR MENGIRIM PESAN DISKUSI PROYEK ---
const addProjectDiscussion = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    const { message, mentions } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });
    }

    try {
        const [project] = await db.query('SELECT community_id FROM projects WHERE id = ?', [projectId]);
        if (project.length === 0) return res.status(404).json({ message: 'Proyek tidak ditemukan.' });
        
        const communityId = project[0].community_id;
        const [member] = await db.query('SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ?', [userId, communityId]);
        const role = member.length > 0 ? member[0].community_role : null;
        
        if (role !== 'KETUA' && role !== 'SEKRETARIS') {
            const [tasks] = await db.query('SELECT id FROM tasks WHERE project_id = ? AND assigned_to = ?', [projectId, userId]);
            if (tasks.length === 0) {
                return res.status(403).json({ message: 'Akses Read-Only: Anda belum ditugaskan dalam proyek ini.' });
            }
        }

        const [result] = await db.query(
            'INSERT INTO project_discussions (project_id, user_id, message) VALUES (?, ?, ?)',
            [projectId, userId, message]
        );

        const [users] = await db.query('SELECT nama, foto_profile FROM users WHERE id = ?', [userId]);
        const userName = users[0]?.nama || 'Unknown';

        const newMessageObj = {
            id: result.insertId,
            project_id: projectId,
            user_id: userId,
            message: message,
            created_at: new Date().toISOString(),
            is_edited: 0,
            user_name: userName,
            read_by: []
        };

        // Emit pesan ke room proyek
        if (req.io) {
            req.io.to(`project_${projectId}`).emit('new_message', newMessageObj);
        }

        // Handle Mentions (Kirim notifikasi inbox)
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            const [projects] = await db.query('SELECT nama_proker FROM projects WHERE id = ?', [projectId]);
            const projectName = projects[0]?.nama_proker || 'Proyek';

            for (const mentionedUserId of mentions) {
                if (mentionedUserId === userId) continue;
                await db.query(
                    'INSERT INTO messages (sender_id, receiver_id, subject, content, type) VALUES (?, ?, ?, ?, ?)',
                    [userId, mentionedUserId, `Anda ditandai di ${projectName}`, `${userName} menyebut Anda dalam obrolan proyek: "${message}"`, 'SYSTEM']
                );
            }
        }

        res.status(201).json({ 
            message: 'Pesan berhasil dikirim!', 
            discussionId: result.insertId,
            data: newMessageObj
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengirim pesan diskusi.' });
    }
};

// --- FITUR EDIT PESAN DISKUSI ---
const editProjectDiscussion = async (req, res) => {
    const { projectId, messageId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    try {
        const [existing] = await db.query('SELECT user_id FROM project_discussions WHERE id = ? AND project_id = ?', [messageId, projectId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
        if (existing[0].user_id !== userId) return res.status(403).json({ message: 'Hanya pengirim yang bisa mengedit.' });

        await db.query('UPDATE project_discussions SET message = ?, is_edited = TRUE WHERE id = ?', [message, messageId]);

        if (req.io) {
            req.io.to(`project_${projectId}`).emit('message_updated', { id: Number(messageId), message });
        }

        res.status(200).json({ message: 'Pesan berhasil diubah.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengedit pesan.' });
    }
};

// --- FITUR HAPUS PESAN DISKUSI ---
const deleteProjectDiscussion = async (req, res) => {
    const { projectId, messageId } = req.params;
    const userId = req.user.id;

    try {
        const [existing] = await db.query('SELECT user_id FROM project_discussions WHERE id = ? AND project_id = ?', [messageId, projectId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Pesan tidak ditemukan.' });
        
        // Hanya pengirim atau ketua komunitas yang bisa menghapus (untuk sederhana, batasi ke pengirim dulu)
        if (existing[0].user_id !== userId) return res.status(403).json({ message: 'Hanya pengirim yang bisa menghapus.' });

        await db.query('DELETE FROM project_discussions WHERE id = ?', [messageId]);

        if (req.io) {
            req.io.to(`project_${projectId}`).emit('message_deleted', { id: Number(messageId) });
        }

        res.status(200).json({ message: 'Pesan berhasil dihapus.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus pesan.' });
    }
};

// --- FITUR MARK AS READ ---
const markDiscussionAsRead = async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { messageIds } = req.body; // Array of message IDs that have been read

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ message: 'Daftar pesan kosong.' });
    }

    try {
        // Prepare bulk insert ignoring duplicates
        const values = messageIds.map(id => [id, userId]);
        await db.query('INSERT IGNORE INTO project_discussion_reads (message_id, user_id) VALUES ?', [values]);

        const [users] = await db.query('SELECT nama FROM users WHERE id = ?', [userId]);
        const userName = users[0]?.nama;

        if (req.io) {
            req.io.to(`project_${projectId}`).emit('message_read', { messageIds, userName, userId });
        }

        res.status(200).json({ message: 'Pesan ditandai telah dibaca.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menandai pesan.' });
    }
};

module.exports = {
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
};