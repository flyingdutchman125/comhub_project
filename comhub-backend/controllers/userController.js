const db = require('../config/db');

// --- GET PROFILE USER ---
const getProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.query(
            'SELECT id, nama, email, prodi, bio, skills, foto_profile FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

        const user = users[0];
        // Parse skills JSON
        try { user.skills = user.skills ? JSON.parse(user.skills) : [] } catch { user.skills = [] }

        // Ambil komunitas yang diikuti
        const [memberships] = await db.query(`
            SELECT c.id as community_id, c.nama_komunitas, c.logo, cm.community_role, cm.joined_at
            FROM community_members cm
            JOIN communities c ON cm.community_id = c.id
            WHERE cm.user_id = ? AND cm.status_keanggotaan = 'AKTIF'
            ORDER BY cm.joined_at DESC
        `, [userId]);

        res.status(200).json({ ...user, memberships });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil profil.' });
    }
};

// --- UPDATE PROFILE USER ---
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { nama, prodi, bio, skills, foto_profile } = req.body;
    try {
        const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);
        await db.query(
            'UPDATE users SET nama = ?, prodi = ?, bio = ?, skills = ?, foto_profile = ? WHERE id = ?',
            [nama, prodi, bio, skillsJson, foto_profile, userId]
        );
        res.status(200).json({ message: 'Profil berhasil diperbarui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memperbarui profil.' });
    }
};

// --- GET PORTFOLIO (profile + approved task submissions) ---
const getPortfolio = async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Data user
        const [users] = await db.query(
            'SELECT id, nama, email, prodi, bio, skills, foto_profile FROM users WHERE id = ?', [userId]
        );
        if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        const user = users[0];
        try { user.skills = user.skills ? JSON.parse(user.skills) : [] } catch { user.skills = [] }

        // 2. Komunitas yang diikuti
        const [memberships] = await db.query(`
            SELECT c.id as community_id, c.nama_komunitas, c.logo, cm.community_role, cm.joined_at
            FROM community_members cm
            JOIN communities c ON cm.community_id = c.id
            WHERE cm.user_id = ? AND cm.status_keanggotaan = 'AKTIF'
            ORDER BY cm.joined_at DESC
        `, [userId]);

        // 3. Task yang di-assign ke user (semua status)
        const [tasks] = await db.query(`
            SELECT 
                t.id as task_id, t.judul_tugas, t.deskripsi as task_desc, t.status as task_status,
                t.created_at as task_created_at,
                p.id as project_id, p.nama_proker as project_name, p.deskripsi as project_desc,
                p.progress as project_progress, p.start_date, p.end_date,
                c.id as community_id, c.nama_komunitas,
                ts.id as submission_id, ts.status as submission_status, ts.submitted_at, ts.file_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN communities c ON p.community_id = c.id
            LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.user_id = ?
            WHERE t.assigned_to = ?
            ORDER BY t.created_at DESC
        `, [userId, userId]);

        // 4. Kelompokkan per komunitas -> per proyek
        const portfolioMap = {};
        tasks.forEach(task => {
            const commKey = task.community_id;
            if (!portfolioMap[commKey]) {
                portfolioMap[commKey] = {
                    community_id: task.community_id,
                    community_name: task.nama_komunitas,
                    projects: {}
                };
            }
            const projKey = task.project_id;
            if (!portfolioMap[commKey].projects[projKey]) {
                portfolioMap[commKey].projects[projKey] = {
                    project_id: task.project_id,
                    project_name: task.project_name,
                    project_desc: task.project_desc,
                    project_progress: task.project_progress,
                    start_date: task.start_date,
                    end_date: task.end_date,
                    tasks: []
                };
            }
            portfolioMap[commKey].projects[projKey].tasks.push({
                task_id: task.task_id,
                judul_tugas: task.judul_tugas,
                task_desc: task.task_desc,
                status: task.task_status,
                created_at: task.task_created_at,
                submission_id: task.submission_id,
                submission_status: task.submission_status,
                submitted_at: task.submitted_at,
                file_name: task.file_name
            });
        });

        const portfolio = Object.values(portfolioMap).map(comm => ({
            ...comm,
            projects: Object.values(comm.projects)
        }));

        // 5. Statistik
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => t.submission_status === 'APPROVED').length;
        const pendingTasks = tasks.filter(t => t.submission_status === 'PENDING').length;
        const totalProjects = new Set(tasks.map(t => t.project_id)).size;

        res.status(200).json({
            user,
            stats: {
                totalCommunities: memberships.length,
                totalProjects,
                totalTasks,
                approvedTasks: doneTasks,
                pendingTasks,
                completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
            },
            memberships,
            portfolio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil portofolio.' });
    }
};

// --- GET MY TASKS (untuk anggota melihat to-do list mereka) ---
const getMyTasks = async (req, res) => {
    const userId = req.user.id;
    try {
        const [tasks] = await db.query(`
            SELECT 
                t.id, t.judul_tugas, t.deskripsi, t.status,
                p.id as project_id, p.nama_proker as project_name, p.end_date,
                c.id as community_id, c.nama_komunitas,
                ts.id as submission_id, ts.status as submission_status,
                ts.file_name, ts.submitted_at, ts.ketua_note
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN communities c ON p.community_id = c.id
            LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.user_id = ?
            WHERE t.assigned_to = ?
            ORDER BY t.created_at DESC
        `, [userId, userId]);

        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil tugas.' });
    }
};

// --- SUBMIT TASK (anggota mengumpulkan dokumen/PDF) ---
const submitTask = async (req, res) => {
    const userId = req.user.id;
    const taskId = req.params.taskId;
    const { file_name, file_data, file_type, notes } = req.body;

    try {
        // Cek apakah task memang assigned ke user ini
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?', [taskId, userId]);
        if (tasks.length === 0) return res.status(403).json({ message: 'Tugas tidak ditemukan atau bukan milik Anda.' });

        // Cek apakah sudah ada submission sebelumnya
        const [existing] = await db.query('SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ?', [taskId, userId]);
        if (existing.length > 0) {
            // Update submission yang ada
            await db.query(
                'UPDATE task_submissions SET file_name = ?, file_data = ?, file_type = ?, notes = ?, status = "PENDING", submitted_at = NOW() WHERE id = ?',
                [file_name, file_data, file_type, notes, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO task_submissions (task_id, user_id, file_name, file_data, file_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [taskId, userId, file_name, file_data, file_type, notes]
            );
        }

        // Update status task ke IN_PROGRESS jika masih TODO
        await db.query('UPDATE tasks SET status = "IN_PROGRESS" WHERE id = ? AND status = "TODO"', [taskId]);

        // Kirim notifikasi ke Ketua via pesan
        const [projects] = await db.query(`
            SELECT p.community_id, p.nama_proker, cm.user_id as ketua_id, u.nama as member_name
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            JOIN community_members cm ON cm.community_id = p.community_id AND cm.community_role = 'KETUA' AND cm.status_keanggotaan = 'AKTIF'
            JOIN users u ON u.id = ?
            WHERE t.id = ?
        `, [userId, taskId]);

        if (projects.length > 0) {
            const proj = projects[0];
            await db.query(
                'INSERT INTO messages (sender_id, receiver_id, subject, content, type) VALUES (?, ?, ?, ?, ?)',
                [userId, proj.ketua_id,
                    `Pengumpulan Tugas: ${tasks[0].judul_tugas}`,
                    `${proj.member_name} telah mengumpulkan dokumen untuk tugas "${tasks[0].judul_tugas}" pada proyek "${proj.nama_proker}". Silakan tinjau dan berikan persetujuan.`,
                    'TASK_SUBMISSION']
            );
        }

        res.status(200).json({ message: 'Tugas berhasil dikumpulkan! Menunggu persetujuan Ketua.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengumpulkan tugas.' });
    }
};

// --- GET SUBMISSIONS untuk sebuah task (untuk Ketua) ---
const getTaskSubmissions = async (req, res) => {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    try {
        // Otorisasi: hanya Ketua/Sekretaris
        const [tasks] = await db.query(`
            SELECT t.*, p.community_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = ?
        `, [taskId]);
        if (tasks.length === 0) return res.status(404).json({ message: 'Tugas tidak ditemukan.' });

        const [roleCheck] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, tasks[0].community_id]
        );
        if (roleCheck.length === 0 || !['KETUA', 'SEKRETARIS'].includes(roleCheck[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }

        const [submissions] = await db.query(`
            SELECT ts.*, u.nama as user_name, u.email as user_email
            FROM task_submissions ts
            JOIN users u ON ts.user_id = u.id
            WHERE ts.task_id = ?
            ORDER BY ts.submitted_at DESC
        `, [taskId]);

        // Jangan kirim file_data ke list, hanya saat download
        const result = submissions.map(s => ({ ...s, file_data: undefined }));
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data pengumpulan.' });
    }
};

// --- DOWNLOAD SUBMISSION FILE ---
const downloadSubmission = async (req, res) => {
    const submissionId = req.params.submissionId;
    const userId = req.user.id;

    try {
        const [subs] = await db.query(`
            SELECT ts.*, p.community_id
            FROM task_submissions ts
            JOIN tasks t ON ts.task_id = t.id
            JOIN projects p ON t.project_id = p.id
            WHERE ts.id = ?
        `, [submissionId]);

        if (subs.length === 0) return res.status(404).json({ message: 'File tidak ditemukan.' });
        const sub = subs[0];

        // Izinkan: pemilik submission ATAU ketua/sekretaris
        if (sub.user_id !== userId) {
            const [roleCheck] = await db.query(
                'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
                [userId, sub.community_id]
            );
            if (roleCheck.length === 0 || !['KETUA', 'SEKRETARIS'].includes(roleCheck[0].community_role)) {
                return res.status(403).json({ message: 'Akses ditolak.' });
            }
        }

        res.status(200).json({ file_data: sub.file_data, file_name: sub.file_name, file_type: sub.file_type });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengunduh file.' });
    }
};

// --- REVIEW SUBMISSION (Ketua approve/reject) ---
const reviewSubmission = async (req, res) => {
    const submissionId = req.params.submissionId;
    const userId = req.user.id;
    const { status, ketua_note } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Status tidak valid. Gunakan APPROVED atau REJECTED.' });
    }

    try {
        const [subs] = await db.query(`
            SELECT ts.*, t.assigned_to, t.judul_tugas, p.community_id, p.nama_proker
            FROM task_submissions ts
            JOIN tasks t ON ts.task_id = t.id
            JOIN projects p ON t.project_id = p.id
            WHERE ts.id = ?
        `, [submissionId]);

        if (subs.length === 0) return res.status(404).json({ message: 'Submission tidak ditemukan.' });
        const sub = subs[0];

        // Otorisasi: hanya Ketua
        const [roleCheck] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, sub.community_id]
        );
        if (roleCheck.length === 0 || roleCheck[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Hanya Ketua yang dapat meninjau pengumpulan.' });
        }

        // Update status submission
        await db.query(
            'UPDATE task_submissions SET status = ?, ketua_note = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
            [status, ketua_note, userId, submissionId]
        );

        // Jika APPROVED, update task status ke DONE
        if (status === 'APPROVED') {
            await db.query('UPDATE tasks SET status = "DONE" WHERE id = ?', [sub.task_id]);
        }

        // Kirim notifikasi ke anggota
        const msg = status === 'APPROVED'
            ? `Tugas "${sub.judul_tugas}" Anda pada proyek "${sub.nama_proker}" telah DISETUJUI dan akan masuk ke portofolio Anda! ${ketua_note ? `\nCatatan: ${ketua_note}` : ''}`
            : `Tugas "${sub.judul_tugas}" Anda pada proyek "${sub.nama_proker}" DITOLAK dan perlu diperbaiki. ${ketua_note ? `\nAlasan: ${ketua_note}` : ''}`;

        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, subject, content, type) VALUES (?, ?, ?, ?, ?)',
            [userId, sub.assigned_to,
                status === 'APPROVED' ? `Tugas Disetujui: ${sub.judul_tugas}` : `Tugas Ditolak: ${sub.judul_tugas}`,
                msg, 'TASK_REVIEW']
        );

        res.status(200).json({ message: `Submission berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal meninjau submission.' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getPortfolio,
    getMyTasks,
    submitTask,
    getTaskSubmissions,
    downloadSubmission,
    reviewSubmission
};
