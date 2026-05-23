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
            'INSERT INTO communities (nama_komunitas, deskripsi, logo) VALUES (?, ?, ?)',
            [nama_komunitas, deskripsi, logo]
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

// --- FITUR MELIHAT KOMUNITAS YANG DIIKUTI USER ---
const getUserCommunities = async (req, res) => {
    const userId = req.user.id;

    try {
        const [communities] = await db.query(`
            SELECT c.id, c.nama_komunitas, c.deskripsi, c.logo, c.created_at,
                cm.community_role, cm.status_keanggotaan,
                (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status_keanggotaan = 'AKTIF') as memberCount,
                (SELECT COUNT(*) FROM projects p WHERE p.community_id = c.id) as projectCount
            FROM community_members cm
            JOIN communities c ON cm.community_id = c.id
            WHERE cm.user_id = ? AND cm.status_keanggotaan IN ('AKTIF', 'MENUNGGU_SELEKSI')
            ORDER BY c.created_at DESC
        `, [userId]);

        const formatted = communities.map(c => ({
            id: c.id,
            name: c.nama_komunitas,
            description: c.deskripsi,
            logo: c.logo,
            memberCount: c.memberCount,
            projectCount: c.projectCount,
            community_role: c.community_role,
            status_keanggotaan: c.status_keanggotaan,
            created_at: c.created_at
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data komunitas user' });
    }
};

// --- FITUR MENDAFTAR KE KOMUNITAS (OPEN RECRUITMENT) ---
const joinCommunity = async (req, res) => {
    const communityId = req.params.id; // Mendapatkan ID komunitas dari URL
    const userId = req.user.id; // Mendapatkan ID mahasiswa dari token JWT

    try {
        // 1. Cek apakah komunitasnya benar-benar ada
        const [community] = await db.query('SELECT * FROM communities WHERE id = ?', [communityId]);
        if (community.length === 0) {
            return res.status(404).json({ message: 'Komunitas tidak ditemukan!' });
        }

        // 2. Cek apakah user sudah pernah mendaftar atau sudah menjadi anggota
        const [existingMember] = await db.query(
            'SELECT * FROM community_members WHERE user_id = ? AND community_id = ?',
            [userId, communityId]
        );

        if (existingMember.length > 0) {
            return res.status(400).json({
                message: 'Anda sudah mendaftar atau sudah menjadi bagian dari komunitas ini!'
            });
        }

        // 2.5 Cek apakah user adalah pengurus inti di komunitas manapun
        const [coreRoleCheck] = await db.query(
            'SELECT * FROM community_members WHERE user_id = ? AND community_role IN ("KETUA", "SEKRETARIS", "BENDAHARA") AND status_keanggotaan = "AKTIF"',
            [userId]
        );
        
        if (coreRoleCheck.length > 0) {
            return res.status(400).json({
                message: 'Pengurus inti (Ketua, Sekretaris, Bendahara) tidak diizinkan untuk bergabung dengan komunitas lain.'
            });
        }

        // 3. Masukkan data ke database dengan status MENUNGGU_SELEKSI
        await db.query(
            'INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan) VALUES (?, ?, ?, ?)',
            [userId, communityId, 'ANGGOTA', 'MENUNGGU_SELEKSI']
        );

        res.status(201).json({
            message: 'Berhasil mendaftar! Silakan tunggu proses seleksi dari pengurus komunitas.'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mendaftar ke komunitas' });
    }
};

// --- FITUR MELIHAT DAFTAR PENDAFTAR (HANYA UNTUK PENGURUS) ---
const getApplicants = async (req, res) => {
    const communityId = req.params.id;
    const userId = req.user.id;

    try {
        // 1. Otorisasi: Pastikan yang mengakses ini adalah Ketua/Pengurus di komunitas tersebut
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'KADIV'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa melihat pendaftar.' });
        }

        // 2. Ambil data pendaftar (Join dengan tabel users untuk dapat nama dan email)
        const [applicants] = await db.query(`
            SELECT u.id, u.nama, u.email, cm.joined_at 
            FROM community_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.community_id = ? AND cm.status_keanggotaan = 'MENUNGGU_SELEKSI'
        `, [communityId]);

        res.status(200).json(applicants);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pendaftar' });
    }
};

// --- FITUR MENERIMA ANGGOTA BARU ---
const approveApplicant = async (req, res) => {
    const communityId = req.params.id;
    const applicantId = req.params.userId; // ID mahasiswa yang mendaftar
    const userId = req.user.id; // ID pengurus yang sedang login

    try {
        // 1. Otorisasi (sama seperti di atas)
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'KADIV'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Anda bukan pengurus komunitas ini.' });
        }

        // 2. Ubah status pendaftar menjadi AKTIF
        const [result] = await db.query(
            'UPDATE community_members SET status_keanggotaan = "AKTIF" WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "MENUNGGU_SELEKSI"',
            [applicantId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pendaftar tidak ditemukan atau sudah diproses.' });
        }

        res.status(200).json({ message: 'Pendaftar berhasil diterima sebagai anggota aktif!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memproses pendaftar' });
    }
};

// --- FITUR MENGUBAH JABATAN ANGGOTA (HANYA UNTUK KETUA) ---
const assignRole = async (req, res) => {
    const communityId = req.params.id;
    const targetUserId = req.params.userId; // ID anggota yang akan diubah jabatannya
    const { newRole } = req.body; // Jabatan baru (contoh: 'SEKRETARIS')
    const currentUserId = req.user.id; // ID pengurus yang sedang login

    try {
        // 1. Otorisasi: Pastikan yang melakukan ini HANYA Ketua
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [currentUserId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua yang dapat mengubah struktur kepengurusan.' });
        }

        // 2. Validasi role yang dimasukkan
        const validRoles = ['ANGGOTA', 'SEKRETARIS', 'BENDAHARA', 'KADIV'];
        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ message: 'Jabatan tidak valid!' });
        }

        // 2.5 Validasi tambahan: Jika akan diangkat menjadi pengurus inti, pastikan hanya di 1 komunitas
        if (['SEKRETARIS', 'BENDAHARA'].includes(newRole)) {
            const [userCommunities] = await db.query(
                'SELECT community_id FROM community_members WHERE user_id = ? AND status_keanggotaan = "AKTIF"',
                [targetUserId]
            );
            if (userCommunities.length > 1) {
                return res.status(400).json({
                    error_code: 'MULTIPLE_COMMUNITIES',
                    message: `Anggota ini tergabung di lebih dari 1 komunitas. Syarat menjadi ${newRole} adalah harus keluar dari komunitas lain terlebih dahulu.`
                });
            }
        }

        // 3. Update jabatan anggota target
        const [result] = await db.query(
            'UPDATE community_members SET community_role = ? WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [newRole, targetUserId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan atau statusnya belum aktif.' });
        }

        res.status(200).json({ message: `Berhasil! Jabatan anggota telah diperbarui menjadi ${newRole}.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengubah jabatan.' });
    }
};

// --- FITUR MENGHAPUS ANGGOTA DARI KOMUNITAS (HANYA KETUA) ---
const removeMember = async (req, res) => {
    const communityId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    try {
        // 1. Otorisasi: Hanya Ketua yang bisa menghapus anggota
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [currentUserId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua yang bisa menghapus anggota.' });
        }

        // 2. Pastikan bukan menghapus diri sendiri
        if (parseInt(targetUserId) === currentUserId) {
            return res.status(400).json({ message: 'Anda tidak bisa menghapus diri sendiri dari komunitas!' });
        }

        // 3. Hapus anggota
        const [result] = await db.query(
            'DELETE FROM community_members WHERE user_id = ? AND community_id = ?',
            [targetUserId, communityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan di komunitas ini.' });
        }

        res.status(200).json({ message: 'Anggota berhasil dikeluarkan dari komunitas.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus anggota.' });
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
            SELECT cm.id, u.id as user_id, u.nama, cm.community_role, cm.status_keanggotaan, cm.joined_at
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

        // 7. Return data lengkap
        res.status(200).json({
            id: community[0].id,
            name: community[0].nama_komunitas,
            description: community[0].deskripsi,
            logo: community[0].logo,
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

// --- FITUR MELIHAT DAFTAR ANGGOTA AKTIF KOMUNITAS ---
const getCommunityMembers = async (req, res) => {
    const communityId = req.params.id;
    try {
        const [members] = await db.query(`
            SELECT cm.id, u.id as user_id, u.nama, cm.community_role, cm.status_keanggotaan, cm.joined_at
            FROM community_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.community_id = ? AND cm.status_keanggotaan = 'AKTIF'
            ORDER BY cm.community_role DESC, u.nama ASC
        `, [communityId]);
        res.status(200).json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data anggota komunitas' });
    }
};

// JANGAN LUPA: Update module.exports
module.exports = {
    createCommunity,
    getAllCommunities,
    getUserCommunities,
    getCommunityById,
    joinCommunity,
    getApplicants,
    approveApplicant,
    assignRole,
    removeMember,
    generateReport,
    getCommunityMembers
};
