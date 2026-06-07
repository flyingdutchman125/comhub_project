const db = require('../config/db');

// Mengambil daftar komunitas yang menunggu persetujuan
const getPendingCommunities = async (req, res) => {
    const role = req.user.role;

    let targetStatus = '';
    if (role === 'DOSEN') {
        targetStatus = 'MENUNGGU_DOSEN';
    } else if (role === 'KEMAHASISWAAN') {
        targetStatus = 'MENUNGGU_KEMAHASISWAAN';
    } else {
        return res.status(403).json({ message: 'Akses ditolak. Anda tidak berhak melihat daftar persetujuan.' });
    }

    try {
        let queryStr = `
            SELECT c.*,
                (SELECT u.nama FROM community_members cm JOIN users u ON cm.user_id = u.id WHERE cm.community_id = c.id AND cm.community_role = 'KETUA' LIMIT 1) as founder_name
            FROM communities c
        `;
        let queryParams = [];

        if (role === 'DOSEN') {
            queryStr += ` WHERE c.approval_status = 'MENUNGGU_DOSEN' OR c.upgrade_status = 'MENUNGGU_DOSEN' ORDER BY c.created_at ASC`;
        } else {
            queryStr += ` WHERE c.approval_status = ? OR c.upgrade_status = ? ORDER BY c.created_at ASC`;
            queryParams.push(targetStatus, targetStatus);
        }

        const [communities] = await db.query(queryStr, queryParams);

        res.status(200).json(communities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil daftar pengajuan komunitas' });
    }
};

// Dosen menyetujui pengajuan komunitas (Tahap 1)
const approveByDosen = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;
    const { eligibility_notes } = req.body;

    if (role !== 'DOSEN') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Dosen Pembina yang dapat menyetujui di tahap ini.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE communities SET approval_status = \'MENUNGGU_KEMAHASISWAAN\', eligibility_notes = ?, dosen_pembina_id = ? WHERE id = ? AND approval_status = \'MENUNGGU_DOSEN\'',
            [eligibility_notes || null, dosenId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan atau status tidak valid untuk disetujui Dosen.' });
        }

        res.status(200).json({ message: 'Komunitas berhasil disetujui Dosen Pembina. Menunggu persetujuan Kemahasiswaan.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyetujui komunitas' });
    }
};

// Mengatur jadwal wawancara oleh Dosen
const setInterviewDate = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;
    const { interview_date } = req.body;

    if (role !== 'DOSEN') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE communities SET interview_date = ? WHERE id = ? AND approval_status = \'MENUNGGU_DOSEN\'',
            [interview_date, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan atau status tidak valid.' });
        }

        res.status(200).json({ message: 'Jadwal wawancara berhasil diatur.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengatur jadwal' });
    }
};

// Kemahasiswaan menyetujui dan menerbitkan SK (Tahap 2)
const approveByKemahasiswaan = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;
    const { sk_number } = req.body;

    if (role !== 'KEMAHASISWAAN') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya Kemahasiswaan yang dapat memberikan SK dan persetujuan akhir.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE communities SET approval_status = \'DISETUJUI\', sk_number = ? WHERE id = ? AND approval_status = \'MENUNGGU_KEMAHASISWAAN\'',
            [sk_number || null, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan atau status tidak valid untuk disetujui Kemahasiswaan.' });
        }

        res.status(200).json({ message: 'Komunitas berhasil disetujui dan resmi aktif di ComHub!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyetujui komunitas' });
    }
};

// Menolak pengajuan komunitas (Bisa dilakukan oleh Dosen atau Kemahasiswaan)
const rejectCommunity = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;

    if (role !== 'DOSEN' && role !== 'KEMAHASISWAAN') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Hanya bisa menolak jika statusnya sesuai wewenangnya
    let allowedStatus = role === 'DOSEN' ? 'MENUNGGU_DOSEN' : 'MENUNGGU_KEMAHASISWAAN';

    try {
        const [result] = await db.query(
            'UPDATE communities SET approval_status = \'DITOLAK\' WHERE id = ? AND approval_status = ?',
            [communityId, allowedStatus]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan atau status tidak valid untuk ditolak.' });
        }

        res.status(200).json({ message: 'Pengajuan komunitas telah ditolak.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menolak komunitas' });
    }
};

// Mengajukan komunitas menjadi UKM
const applyForUKMUpgrade = async (req, res) => {
    const communityId = req.params.id;

    try {
        // 1. Cek Umur Komunitas (minimal 3 tahun)
        const [commRes] = await db.query('SELECT DATEDIFF(CURRENT_DATE, created_at) as days_old FROM communities WHERE id = ?', [communityId]);
        if (!commRes.length) return res.status(404).json({ message: 'Komunitas tidak ditemukan' });
        
        const isOldEnough = commRes[0].days_old >= (3 * 365);

        // 2. Cek Absensi (Minimal 80% selama 3 tahun)
        const [attRes] = await db.query(`
            SELECT 
                COUNT(*) as total_attendance,
                SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) as hadir_count
            FROM attendances a
            JOIN attendance_sessions s ON a.session_id = s.id
            WHERE s.community_id = ? AND s.session_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR)
        `, [communityId]);
        
        const totalAtt = attRes[0].total_attendance || 0;
        const hadirCount = attRes[0].hadir_count || 0;
        const attendancePercentage = totalAtt > 0 ? (hadirCount / totalAtt) * 100 : 0;
        const isAttendanceGood = attendancePercentage >= 80;

        // 3. Cek Keuangan (Pemasukan > Pengeluaran)
        const [finRes] = await db.query(`
            SELECT 
                SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense
            FROM finances
            WHERE community_id = ? AND transaction_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR)
        `, [communityId]);
        
        const totalIncome = parseFloat(finRes[0].total_income || 0);
        const totalExpense = parseFloat(finRes[0].total_expense || 0);
        const isFinanciallyHealthy = totalIncome > totalExpense;

        // 4. Cek Minimal 3 Project Terlaksana
        const [projRes] = await db.query(`
            SELECT COUNT(*) as project_count 
            FROM projects 
            WHERE community_id = ? AND progress = 100 AND start_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR)
        `, [communityId]);
        
        const projectCount = projRes[0].project_count || 0;
        const hasEnoughProjects = projectCount >= 3;

        // 5. Cek Rating Keaktifan Anggota (Rata-rata rating dari Ketua >= 3.0)
        const [ratingRes] = await db.query(`
            SELECT AVG(rating) as avg_member_rating, COUNT(rating) as rated_count
            FROM community_members
            WHERE community_id = ? AND status_keanggotaan = 'AKTIF' AND community_role != 'KETUA'
        `, [communityId]);

        const avgMemberRating = parseFloat(ratingRes[0].avg_member_rating || 0);
        const ratedCount = ratingRes[0].rated_count || 0;
        const isRatingGood = ratedCount > 0 && avgMemberRating >= 3.0;

        // Validasi Akhir
        if (!isOldEnough || !isAttendanceGood || !isFinanciallyHealthy || !hasEnoughProjects || !isRatingGood) {
            return res.status(400).json({
                message: 'Syarat belum terpenuhi',
                checklist: {
                    isOldEnough,
                    isAttendanceGood,
                    attendancePercentage: attendancePercentage.toFixed(1) + '%',
                    isFinanciallyHealthy,
                    totalIncome,
                    totalExpense,
                    hasEnoughProjects,
                    projectCount,
                    isRatingGood,
                    avgMemberRating
                }
            });
        }

        // Jika semua lolos, update status ke MENUNGGU_DOSEN untuk upgrade
        await db.query('UPDATE communities SET upgrade_status = \'MENUNGGU_DOSEN\' WHERE id = ?', [communityId]);
        
        res.status(200).json({ message: 'Pengajuan UKM berhasil dikirim dan menunggu persetujuan Dosen!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat verifikasi syarat UKM' });
    }
};

// Dosen menyetujui Upgrade UKM (Ke Kemahasiswaan)
const approveUpgradeDosen = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        const [result] = await db.query(
            'UPDATE communities SET upgrade_status = \'MENUNGGU_KEMAHASISWAAN\', dosen_pembina_id = ? WHERE id = ? AND upgrade_status = \'MENUNGGU_DOSEN\'',
            [dosenId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengajuan UKM tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Pengajuan UKM disetujui Dosen, diteruskan ke Kemahasiswaan!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyetujui upgrade UKM' });
    }
};

// Kemahasiswaan menyetujui Upgrade UKM dan menerbitkan SK
const approveUpgradeKemahasiswaan = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;
    const { sk_number } = req.body;

    if (role !== 'KEMAHASISWAAN') return res.status(403).json({ message: 'Akses ditolak.' });
    if (!sk_number) return res.status(400).json({ message: 'Nomor SK wajib diisi.' });

    try {
        const [result] = await db.query(
            'UPDATE communities SET status = \'UKM\', upgrade_status = \'TIDAK_ADA\', sk_number = ? WHERE id = ? AND upgrade_status = \'MENUNGGU_KEMAHASISWAAN\'',
            [sk_number, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengajuan UKM tidak ditemukan atau status tidak valid.' });
        }

        res.status(200).json({ message: 'Komunitas resmi di-upgrade menjadi UKM!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyetujui upgrade UKM' });
    }
};

// Kemahasiswaan menolak Upgrade UKM
const rejectUpgradeKemahasiswaan = async (req, res) => {
    const communityId = req.params.id;
    const role = req.user.role;

    if (role !== 'KEMAHASISWAAN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        const [result] = await db.query(
            'UPDATE communities SET upgrade_status = \'DITOLAK\' WHERE id = ? AND upgrade_status = \'MENUNGGU_KEMAHASISWAAN\'',
            [communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pengajuan UKM tidak ditemukan atau status tidak valid.' });
        }

        res.status(200).json({ message: 'Pengajuan UKM ditolak.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menolak upgrade UKM' });
    }
};

// --- API BARU UNTUK PERSETUJUAN AKTIVITAS UKM OLEH DOSEN ---

const getPendingUKMActivities = async (req, res) => {
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }

    try {
        // Ambil proyek berstatus PENDING di UKM yang dibina oleh Dosen ini
        const [projects] = await db.query(`
            SELECT p.id, p.nama_proker, p.deskripsi, p.anggaran, p.start_date, p.end_date, p.created_at, p.approval_status, c.nama_komunitas
            FROM projects p
            JOIN communities c ON p.community_id = c.id
            WHERE c.dosen_pembina_id = ? AND c.status = 'UKM' AND p.approval_status = 'PENDING'
            ORDER BY p.created_at DESC
        `, [dosenId]);

        // Ambil transaksi keuangan berstatus PENDING di UKM yang dibina oleh Dosen ini
        const [finances] = await db.query(`
            SELECT f.id, f.type, f.amount, f.description, f.transaction_date, f.approval_status, c.nama_komunitas
            FROM finances f
            JOIN communities c ON f.community_id = c.id
            WHERE c.dosen_pembina_id = ? AND c.status = 'UKM' AND f.approval_status = 'PENDING'
            ORDER BY f.transaction_date DESC
        `, [dosenId]);

        res.status(200).json({
            projects,
            finances
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil aktivitas pending UKM' });
    }
};

const approveProject = async (req, res) => {
    const projectId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        // Validasi kepemilikan binaan
        const [proj] = await db.query('SELECT c.dosen_pembina_id FROM projects p JOIN communities c ON p.community_id = c.id WHERE p.id = ?', [projectId]);
        if (proj.length === 0 || proj[0].dosen_pembina_id !== dosenId) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan pembina UKM ini.' });
        }

        await db.query('UPDATE projects SET approval_status = \'APPROVED\' WHERE id = ? AND approval_status = \'PENDING\'', [projectId]);
        res.status(200).json({ message: 'Proyek UKM disetujui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

const rejectProject = async (req, res) => {
    const projectId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        const [proj] = await db.query('SELECT c.dosen_pembina_id FROM projects p JOIN communities c ON p.community_id = c.id WHERE p.id = ?', [projectId]);
        if (proj.length === 0 || proj[0].dosen_pembina_id !== dosenId) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan pembina UKM ini.' });
        }

        await db.query('UPDATE projects SET approval_status = \'REJECTED\' WHERE id = ? AND approval_status = \'PENDING\'', [projectId]);
        res.status(200).json({ message: 'Proyek UKM ditolak.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

const approveFinance = async (req, res) => {
    const financeId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        const [fin] = await db.query('SELECT c.dosen_pembina_id FROM finances f JOIN communities c ON f.community_id = c.id WHERE f.id = ?', [financeId]);
        if (fin.length === 0 || fin[0].dosen_pembina_id !== dosenId) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan pembina UKM ini.' });
        }

        await db.query('UPDATE finances SET approval_status = \'APPROVED\' WHERE id = ? AND approval_status = \'PENDING\'', [financeId]);
        res.status(200).json({ message: 'Pengajuan Dana disetujui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

const rejectFinance = async (req, res) => {
    const financeId = req.params.id;
    const role = req.user.role;
    const dosenId = req.user.id;

    if (role !== 'DOSEN') return res.status(403).json({ message: 'Akses ditolak.' });

    try {
        const [fin] = await db.query('SELECT c.dosen_pembina_id FROM finances f JOIN communities c ON f.community_id = c.id WHERE f.id = ?', [financeId]);
        if (fin.length === 0 || fin[0].dosen_pembina_id !== dosenId) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan pembina UKM ini.' });
        }

        await db.query('UPDATE finances SET approval_status = \'REJECTED\' WHERE id = ? AND approval_status = \'PENDING\'', [financeId]);
        res.status(200).json({ message: 'Pengajuan Dana ditolak.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

module.exports = {
    getPendingCommunities,
    approveByDosen,
    setInterviewDate,
    approveByKemahasiswaan,
    rejectCommunity,
    applyForUKMUpgrade,
    approveUpgradeDosen,
    approveUpgradeKemahasiswaan,
    rejectUpgradeKemahasiswaan,
    getPendingUKMActivities,
    approveProject,
    rejectProject,
    approveFinance,
    rejectFinance
};
