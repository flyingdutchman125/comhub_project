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

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa menghapus proyek.' });
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

    try {
        const [result] = await db.query(
            'INSERT INTO tasks (project_id, judul_tugas, deskripsi, assigned_to) VALUES (?, ?, ?, ?)',
            [projectId, judul_tugas, deskripsi, assigned_to]
        );
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

module.exports = {
    createProject,
    getProjectsByCommunity,
    updateProject,
    deleteProject,
    createTask,
    updateTaskStatus,
    getProjectBoard
};