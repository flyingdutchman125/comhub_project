const db = require('../config/db');

// --- FITUR MEMBUAT PROKER BARU ---
const createProject = async (req, res) => {
    const communityId = req.params.communityId;
    const { nama_proker, deskripsi, start_date, end_date } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO projects (community_id, nama_proker, deskripsi, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
            [communityId, nama_proker, deskripsi, start_date, end_date]
        );
        res.status(201).json({ message: 'Proker berhasil dibuat!', projectId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat proker.' });
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

module.exports = { createProject, createTask, updateTaskStatus, getProjectBoard };