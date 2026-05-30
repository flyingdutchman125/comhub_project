const db = require('../config/db');

// --- FITUR MEMBUAT KOMUNITAS BARU ---
const createCommunity = async (req, res) => {
    const { nama_komunitas, deskripsi, logo } = req.body;

    // Ambil ID user dari token JWT (dari middleware)
    const userId = req.user.id;

    // Ambil koneksi khusus untuk transaction
    const connection = await db.getConnection();

    try {
        // Mulai transaksi
        await connection.beginTransaction();

        // 1. Simpan data komunitas baru ke tabel `communities`
        const [commResult] = await connection.query(
            'INSERT INTO communities (nama_komunitas, deskripsi, logo, status, approval_status) VALUES (?, ?, ?, ?, ?)',
            [nama_komunitas, deskripsi, logo, 'KOMUNITAS', 'MENUNGGU_KEMAHASISWAAN']
        );
        const communityId = commResult.insertId;

        // 2. Daftarkan pembuatnya ke tabel `community_members` sebagai KETUA dan status AKTIF
        await connection.query(
            'INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan) VALUES (?, ?, ?, ?)',
            [userId, communityId, 'KETUA', 'AKTIF']
        );

        // Jika kedua proses di atas berhasil, simpan permanen ke database
        await connection.commit();

        res.status(201).json({
            message: 'Komunitas berhasil dibuat dan Anda telah ditetapkan sebagai Ketua!',
            communityId: communityId
        });

    } catch (error) {
        // Jika ada salah satu yang gagal, batalkan semua perubahan
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat komunitas' });
    } finally {
        // Kembalikan koneksi ke pool
        connection.release();
    }
};

// --- FITUR MELIHAT SEMUA KOMUNITAS (DENGAN MEMBER COUNT & PROJECT COUNT) ---
const getAllCommunities = async (req, res) => {
    try {
        const [communities] = await db.query(`
            SELECT c.*,
                (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id AND cm.status_keanggotaan = 'AKTIF') as memberCount,
                (SELECT COUNT(*) FROM projects p WHERE p.community_id = c.id) as projectCount
            FROM communities c
            WHERE c.approval_status = 'DISETUJUI' OR c.approval_status = 'TIDAK_ADA'
            ORDER BY c.created_at DESC
        `);

        // Format response agar konsisten
        const formatted = communities.map(c => ({
            id: c.id,
            name: c.nama_komunitas,
            description: c.deskripsi,
            logo: c.logo,
            memberCount: c.memberCount,
            projectCount: c.projectCount,
            created_at: c.created_at
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data komunitas' });
    }
};

// --- FITUR MELIHAT TOP KOMUNITAS ---
const getTopCommunities = async (req, res) => {
    try {
        const [topCommunities] = await db.query(`
            SELECT c.id, c.nama_komunitas, c.deskripsi, c.logo,
                   COUNT(p.id) AS completed_projects
            FROM communities c
            LEFT JOIN projects p ON c.id = p.community_id 
                                 AND p.progress = 100 
                                 AND MONTH(p.end_date) = MONTH(CURRENT_DATE()) 
                                 AND YEAR(p.end_date) = YEAR(CURRENT_DATE())
            WHERE c.approval_status = 'DISETUJUI' OR c.approval_status = 'TIDAK_ADA'
            GROUP BY c.id
            ORDER BY completed_projects DESC
            LIMIT 10
        `);
        res.status(200).json(topCommunities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data top komunitas' });
    }
};

// --- FITUR MELIHAT KOMUNITAS YANG DIIKUTI USER ---
const getUserCommunities = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let communities;
        if (role === 'DOSEN') {
            [communities] = await db.query(`
                SELECT c.id, c.nama_komunitas, c.deskripsi, c.logo, c.created_at, c.approval_status,
                    'PEMBINA' as community_role, 'AKTIF' as status_keanggotaan,
                    (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status_keanggotaan = 'AKTIF') as memberCount,
                    (SELECT COUNT(*) FROM projects p WHERE p.community_id = c.id) as projectCount
                FROM communities c
                WHERE c.dosen_pembina_id = ?
                ORDER BY c.created_at DESC
            `, [userId]);
        } else {
            [communities] = await db.query(`
                SELECT c.id, c.nama_komunitas, c.deskripsi, c.logo, c.created_at, c.approval_status,
                    cm.community_role, cm.status_keanggotaan,
                    (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status_keanggotaan = 'AKTIF') as memberCount,
                    (SELECT COUNT(*) FROM projects p WHERE p.community_id = c.id) as projectCount
                FROM community_members cm
                JOIN communities c ON cm.community_id = c.id
                WHERE cm.user_id = ? AND cm.status_keanggotaan IN ('AKTIF', 'MENUNGGU_SELEKSI')
                ORDER BY c.created_at DESC
            `, [userId]);
        }

        const formatted = communities.map(c => ({
            id: c.id,
            name: c.nama_komunitas,
            description: c.deskripsi,
            logo: c.logo,
            memberCount: c.memberCount,
            projectCount: c.projectCount,
            community_role: c.community_role,
            status_keanggotaan: c.status_keanggotaan,
            approval_status: c.approval_status,
            created_at: c.created_at
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data komunitas user' });
    }
};

// --- FITUR MELIHAT DETAIL KOMUNITAS LENGKAP ---
const getCommunityById = async (req, res) => {
    const communityId = req.params.id;
    const userId = req.user?.id;

    try {
        // 1. Ambil data komunitas
        const [community] = await db.query(
            'SELECT * FROM communities WHERE id = ?',
            [communityId]
        );

        if (community.length === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan' });
        }

        // 2. Ambil data anggota dengan join ke users
        const [members] = await db.query(`
            SELECT cm.id, u.id as user_id, u.nama, cm.community_role, cm.status_keanggotaan, cm.joined_at, cm.rating
            FROM community_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.community_id = ? AND cm.status_keanggotaan = 'AKTIF'
            ORDER BY cm.community_role DESC, u.nama ASC
        `, [communityId]);

        // 3. Ambil data proyek
        const [projects] = await db.query(`
            SELECT id, nama_proker as name, deskripsi, anggaran, progress, start_date, end_date, created_at
            FROM projects
            WHERE community_id = ?
            ORDER BY created_at DESC
        `, [communityId]);

        // 4. Ambil data finansial
        const [finances] = await db.query(`
            SELECT id, type, amount, description, transaction_date
            FROM finances
            WHERE community_id = ?
            ORDER BY transaction_date DESC
        `, [communityId]);

        // 4.5 Ambil data berita (news) komunitas
        const [news] = await db.query(`
            SELECT n.*, u.nama AS author_name
            FROM news n
            JOIN users u ON n.author_id = u.id
            WHERE n.community_id = ?
            ORDER BY n.created_at DESC
        `, [communityId]);

        // 5. Hitung total budget, spent, dan remaining
        let totalBudget = 0;
        let totalSpent = 0;

        finances.forEach(finance => {
            if (finance.type === 'INCOME') {
                totalBudget += parseFloat(finance.amount);
            } else {
                totalSpent += parseFloat(finance.amount);
            }
        });

        const remaining = totalBudget - totalSpent;

        // 6. Cek membership status dari user saat ini (jika authenticated)
        let userStatus = {
            isMember: false,
            userRole: null,
            joinStatus: null
        };

        if (userId) {
            const role = req.user ? req.user.role : null;
            if (role === 'DOSEN' && community[0].dosen_pembina_id === userId) {
                userStatus.isMember = true;
                userStatus.userRole = 'PEMBINA';
                userStatus.joinStatus = 'AKTIF';
            } else {
                const [userMembership] = await db.query(
                    'SELECT community_role, status_keanggotaan FROM community_members WHERE user_id = ? AND community_id = ?',
                    [userId, communityId]
                );

                if (userMembership.length > 0) {
                    userStatus.isMember = userMembership[0].status_keanggotaan === 'AKTIF';
                    userStatus.userRole = userMembership[0].community_role;
                    userStatus.joinStatus = userMembership[0].status_keanggotaan;
                }
            }
        }

        // 7. Return data lengkap
        res.status(200).json({
            id: community[0].id,
            name: community[0].nama_komunitas,
            description: community[0].deskripsi,
            logo: community[0].logo,
            status: community[0].status,
            upgrade_status: community[0].upgrade_status,
            created_at: community[0].created_at,
            members,
            memberCount: members.length,
            projects,
            projectCount: projects.length,
            news,
            financial: {
                totalBudget,
                spent: totalSpent,
                remaining,
                transactions: finances
            },
            ...userStatus
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil detail komunitas' });
    }
};

// --- FITUR EKSPOR LAPORAN KOMUNITAS (HANYA KETUA) ---
const generateReport = async (req, res) => {
    const communityId = req.params.id;
    const userId = req.user.id;

    try {
        // 1. Otorisasi: Hanya Ketua
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua yang bisa mengekspor laporan.' });
        }

        // 2. Ambil data komunitas
        const [community] = await db.query('SELECT * FROM communities WHERE id = ?', [communityId]);
        if (community.length === 0) return res.status(404).json({ message: 'Komunitas tidak ditemukan.' });

        // 3. Ambil anggota aktif
        const [members] = await db.query(`
            SELECT u.nama, u.email, cm.community_role, cm.joined_at
            FROM community_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.community_id = ? AND cm.status_keanggotaan = 'AKTIF'
            ORDER BY cm.community_role, u.nama
        `, [communityId]);

        // 4. Ambil proyek
        const [projects] = await db.query(`
            SELECT nama_proker, deskripsi, anggaran, progress, start_date, end_date
            FROM projects WHERE community_id = ? ORDER BY created_at DESC
        `, [communityId]);

        // 5. Ambil transaksi keuangan
        const [finances] = await db.query(`
            SELECT type, amount, description, transaction_date
            FROM finances WHERE community_id = ? ORDER BY transaction_date DESC
        `, [communityId]);

        // 6. Hitung total keuangan
        let totalIncome = 0, totalExpense = 0;
        finances.forEach(f => {
            if (f.type === 'INCOME') totalIncome += parseFloat(f.amount);
            else totalExpense += parseFloat(f.amount);
        });

        res.status(200).json({
            generated_at: new Date().toISOString(),
            community: {
                id: community[0].id,
                name: community[0].nama_komunitas,
                description: community[0].deskripsi
            },
            summary: {
                totalMembers: members.length,
                totalProjects: projects.length,
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            },
            members,
            projects,
            finances
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat laporan.' });
    }
};


// --- FITUR MEMBERIKAN RATING KEAKTIFAN ANGGOTA (HANYA KETUA) ---
const updateMemberRating = async (req, res) => {
    const communityId = req.params.id;
    const targetUserId = req.params.userId;
    const requesterId = req.user.id;
    const { rating } = req.body;

    // 1. Validasi rating (harus integer 1 sampai 5)
    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return res.status(400).json({ message: 'Rating harus berupa angka antara 1 sampai 5.' });
    }

    try {
        // 2. Otorisasi: Pastikan peminta adalah KETUA di komunitas tersebut
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [requesterId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua Komunitas yang dapat memberikan rating.' });
        }

        // 3. Update rating anggota
        const [result] = await db.query(
            'UPDATE community_members SET rating = ? WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [ratingVal, targetUserId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan atau tidak aktif di komunitas ini.' });
        }

        res.status(200).json({ message: 'Rating keaktifan anggota berhasil diperbarui!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui rating anggota.' });
    }
};

// --- FITUR UPDATE KOMUNITAS (HANYA KETUA/SEKRETARIS) ---
const updateCommunity = async (req, res) => {
    const communityId = req.params.id;
    const userId = req.user.id;
    const { nama_komunitas, deskripsi, logo } = req.body;

    try {
        // 1. Otorisasi: Pastikan user adalah KETUA atau SEKRETARIS di komunitas tersebut
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua atau Sekretaris yang dapat memperbarui pengaturan komunitas.' });
        }

        // 2. Lakukan update
        const [result] = await db.query(
            'UPDATE communities SET nama_komunitas = ?, deskripsi = ?, logo = ? WHERE id = ?',
            [nama_komunitas, deskripsi, logo, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Pengaturan komunitas berhasil diperbarui!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui komunitas.' });
    }
};

module.exports = {
    createCommunity,
    getAllCommunities,
    getUserCommunities,
    getCommunityById,
    generateReport,
    getTopCommunities,
    updateMemberRating,
    updateCommunity
};
