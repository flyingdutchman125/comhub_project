const db = require('../config/db');

// Helper to check if a user is Ketua or Sekretaris of a community
const checkManagePermission = async (userId, communityId) => {
    try {
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0) {
            return { allowed: false, role: null };
        }

        const role = checkRole[0].community_role;
        const allowed = ['KETUA', 'SEKRETARIS'].includes(role);
        return { allowed, role };
    } catch (err) {
        console.error('Error in checkManagePermission:', err);
        return { allowed: false, role: null };
    }
};

// Helper to check if user is a member of the community (active)
const checkMemberPermission = async (userId, communityId) => {
    try {
        const [checkRole] = await db.query(
            'SELECT status_keanggotaan FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );
        return checkRole.length > 0;
    } catch (err) {
        console.error('Error in checkMemberPermission:', err);
        return false;
    }
};

// --- 1. MEMBUAT SESI ABSENSI BARU ---
const createSession = async (req, res) => {
    const communityId = req.params.communityId;
    const userId = req.user.id;
    const { title, description, session_date } = req.body;

    if (!title || !session_date) {
        return res.status(400).json({ message: 'Judul dan tanggal sesi absensi wajib diisi!' });
    }

    // Otorisasi: Hanya Ketua & Sekretaris yang bisa membuat sesi absensi
    const { allowed } = await checkManagePermission(userId, communityId);
    if (!allowed) {
        return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua dan Sekretaris yang dapat mengelola absensi.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Simpan sesi baru
        const [sessionResult] = await connection.query(
            'INSERT INTO attendance_sessions (community_id, title, description, session_date) VALUES (?, ?, ?, ?)',
            [communityId, title, description || null, session_date || null]
        );
        const sessionId = sessionResult.insertId;

        // 2. Ambil semua anggota aktif saat ini
        const [activeMembers] = await connection.query(
            'SELECT user_id FROM community_members WHERE community_id = ? AND status_keanggotaan = "AKTIF"',
            [communityId]
        );

        // 3. Inisialisasi status kehadiran masing-masing menjadi 'ALFA'
        if (activeMembers.length > 0) {
            const insertValues = activeMembers.map(m => [sessionId, m.user_id, 'ALFA']);
            await connection.query(
                'INSERT INTO attendances (session_id, user_id, status) VALUES ?',
                [insertValues]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Sesi absensi berhasil dibuat dan status anggota diinisialisasi!', sessionId });
    } catch (error) {
        await connection.rollback();
        console.error('Error in createSession:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat sesi absensi.' });
    } finally {
        connection.release();
    }
};

// --- 2. MELIHAT DAFTAR SESI ABSENSI KOMUNITAS ---
const getSessions = async (req, res) => {
    const communityId = req.params.communityId;
    const userId = req.user.id;

    // Pastikan user adalah anggota aktif komunitas ini
    const isMember = await checkMemberPermission(userId, communityId);
    if (!isMember) {
        return res.status(403).json({ message: 'Akses ditolak! Anda bukan anggota aktif komunitas ini.' });
    }

    try {
        // Ambil sesi beserta statistik kehadiran ringkas, serta status kehadiran user sendiri
        const [sessions] = await db.query(`
            SELECT s.*, 
                (SELECT COUNT(*) FROM attendances a WHERE a.session_id = s.id) as total_members,
                (SELECT COUNT(*) FROM attendances a WHERE a.session_id = s.id AND a.status = 'HADIR') as total_present,
                (SELECT status FROM attendances a WHERE a.session_id = s.id AND a.user_id = ?) as user_status
            FROM attendance_sessions s
            WHERE s.community_id = ?
            ORDER BY s.session_date DESC, s.created_at DESC
        `, [userId, communityId]);

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error in getSessions:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil daftar sesi absensi.' });
    }
};

// --- 3. MELIHAT DETAIL SESI DAN DAFTAR KEHADIRAN ANGGOTA ---
const getSessionDetails = async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    try {
        // Ambil detail sesi terlebih dahulu
        const [session] = await db.query('SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]);
        if (session.length === 0) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const communityId = session[0].community_id;

        // Pastikan user adalah anggota aktif
        const isMember = await checkMemberPermission(userId, communityId);
        if (!isMember) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan anggota aktif komunitas ini.' });
        }

        // Ambil rekaman absensi
        const [records] = await db.query(`
            SELECT a.id, a.session_id, a.user_id, a.status, a.notes, a.updated_at, u.nama, u.email
            FROM attendances a
            JOIN users u ON a.user_id = u.id
            WHERE a.session_id = ?
            ORDER BY u.nama ASC
        `, [sessionId]);

        res.status(200).json({
            session: session[0],
            records
        });
    } catch (error) {
        console.error('Error in getSessionDetails:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil detail absensi.' });
    }
};

// --- 4. MENGUBAH DETAIL SESI ABSENSI ---
const updateSession = async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;
    const { title, description, session_date } = req.body;

    try {
        const [session] = await db.query('SELECT community_id FROM attendance_sessions WHERE id = ?', [sessionId]);
        if (session.length === 0) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const communityId = session[0].community_id;

        // Otorisasi: Hanya Ketua & Sekretaris
        const { allowed } = await checkManagePermission(userId, communityId);
        if (!allowed) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua dan Sekretaris yang dapat mengelola absensi.' });
        }

        await db.query(
            'UPDATE attendance_sessions SET title = ?, description = ?, session_date = ? WHERE id = ?',
            [title, description || null, session_date || null, sessionId]
        );

        res.status(200).json({ message: 'Sesi absensi berhasil diperbarui!' });
    } catch (error) {
        console.error('Error in updateSession:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengubah sesi absensi.' });
    }
};

// --- 5. MENGHAPUS SESI ABSENSI ---
const deleteSession = async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    try {
        const [session] = await db.query('SELECT community_id FROM attendance_sessions WHERE id = ?', [sessionId]);
        if (session.length === 0) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const communityId = session[0].community_id;

        // Otorisasi: Hanya Ketua & Sekretaris
        const { allowed } = await checkManagePermission(userId, communityId);
        if (!allowed) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua dan Sekretaris yang dapat mengelola absensi.' });
        }

        await db.query('DELETE FROM attendance_sessions WHERE id = ?', [sessionId]);

        res.status(200).json({ message: 'Sesi absensi berhasil dihapus!' });
    } catch (error) {
        console.error('Error in deleteSession:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus sesi absensi.' });
    }
};

// --- 6. MEMPERBARUI STATUS KEHADIRAN ANGGOTA SECARA MASSAL (BULK UPDATE) ---
const updateAttendanceRecords = async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;
    const { records } = req.body; // Array dari { user_id, status, notes }

    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ message: 'Format data absensi tidak valid!' });
    }

    try {
        const [session] = await db.query('SELECT community_id FROM attendance_sessions WHERE id = ?', [sessionId]);
        if (session.length === 0) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const communityId = session[0].community_id;

        // Otorisasi: Hanya Ketua & Sekretaris
        const { allowed } = await checkManagePermission(userId, communityId);
        if (!allowed) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua dan Sekretaris yang dapat mengelola absensi.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (let rec of records) {
                // Pastikan status absensi valid
                if (!['HADIR', 'SAKIT', 'IZIN', 'ALFA'].includes(rec.status)) {
                    continue;
                }

                await connection.query(
                    'UPDATE attendances SET status = ?, notes = ? WHERE session_id = ? AND user_id = ?',
                    [rec.status, rec.notes || null, sessionId, rec.user_id]
                );
            }

            await connection.commit();
            res.status(200).json({ message: 'Rekam absensi anggota berhasil diperbarui!' });
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in updateAttendanceRecords:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui absensi.' });
    }
};

// --- 7. RINGKASAN PERSENTASE & STATISTIK ABSENSI ANGGOTA KOMUNITAS ---
const getAttendanceSummary = async (req, res) => {
    const communityId = req.params.communityId;
    const userId = req.user.id;

    // Pastikan user adalah anggota aktif
    const isMember = await checkMemberPermission(userId, communityId);
    if (!isMember) {
        return res.status(403).json({ message: 'Akses ditolak! Anda bukan anggota aktif komunitas ini.' });
    }

    try {
        // Query agregasi persentase absensi
        const [summary] = await db.query(`
            SELECT u.id as user_id, u.nama, cm.community_role,
                CAST(COUNT(a.id) AS SIGNED) as total_sessions,
                CAST(COALESCE(SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END), 0) AS SIGNED) as hadir_count,
                CAST(COALESCE(SUM(CASE WHEN a.status = 'SAKIT' THEN 1 ELSE 0 END), 0) AS SIGNED) as sakit_count,
                CAST(COALESCE(SUM(CASE WHEN a.status = 'IZIN' THEN 1 ELSE 0 END), 0) AS SIGNED) as izin_count,
                CAST(COALESCE(SUM(CASE WHEN a.status = 'ALFA' THEN 1 ELSE 0 END), 0) AS SIGNED) as alfa_count
            FROM community_members cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN attendances a ON u.id = a.user_id AND a.session_id IN (
                SELECT id FROM attendance_sessions WHERE community_id = ?
            )
            WHERE cm.community_id = ? AND cm.status_keanggotaan = 'AKTIF'
            GROUP BY u.id, u.nama, cm.community_role
            ORDER BY u.nama ASC
        `, [communityId, communityId]);

        const formattedSummary = summary.map(item => ({
            ...item,
            total_sessions: Number(item.total_sessions) || 0,
            hadir_count: Number(item.hadir_count) || 0,
            sakit_count: Number(item.sakit_count) || 0,
            izin_count: Number(item.izin_count) || 0,
            alfa_count: Number(item.alfa_count) || 0,
        }));

        res.status(200).json(formattedSummary);
    } catch (error) {
        console.error('Error in getAttendanceSummary:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memuat rekap absensi.' });
    }
};

// --- 8. ANGGOTA MELAKUKAN ABSEN MANDIRI ---
const markSelfPresent = async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    try {
        // 1. Dapatkan detail sesi absensi
        const [session] = await db.query('SELECT community_id, title FROM attendance_sessions WHERE id = ?', [sessionId]);
        if (session.length === 0) {
            return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        }

        const communityId = session[0].community_id;

        // 2. Pastikan user adalah anggota aktif komunitas ini
        const isMember = await checkMemberPermission(userId, communityId);
        if (!isMember) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan anggota aktif komunitas ini.' });
        }

        // 3. Catat status 'HADIR' untuk user_id ini pada sesi tersebut
        await db.query(`
            INSERT INTO attendances (session_id, user_id, status, notes)
            VALUES (?, ?, 'HADIR', 'Absen Mandiri')
            ON DUPLICATE KEY UPDATE status = 'HADIR', notes = 'Absen Mandiri'
        `, [sessionId, userId]);

        res.status(200).json({ message: `Berhasil melakukan absen mandiri untuk sesi: ${session[0].title}!` });
    } catch (error) {
        console.error('Error in markSelfPresent:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat melakukan absen mandiri.' });
    }
};

module.exports = {
    createSession,
    getSessions,
    getSessionDetails,
    updateSession,
    deleteSession,
    updateAttendanceRecords,
    getAttendanceSummary,
    markSelfPresent
};
