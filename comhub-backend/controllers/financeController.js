const db = require('../config/db');

// --- FITUR MENAMBAH TRANSAKSI BARU ---
const createFinance = async (req, res) => {
    const communityId = req.params.id;
    const userId = req.user.id;
    const { type, amount, description, transaction_date } = req.body;

    try {
        // 1. Otorisasi: Pastikan user adalah pengurus (KETUA/SEKRETARIS/BENDAHARA)
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa menambah transaksi.' });
        }

        // 2. Validasi type
        if (!['INCOME', 'EXPENSE'].includes(type)) {
            return res.status(400).json({ message: 'Tipe transaksi harus INCOME atau EXPENSE!' });
        }

        // 3. Cek status komunitas apakah UKM atau KOMUNITAS biasa
        const [commInfo] = await db.query('SELECT status FROM communities WHERE id = ?', [communityId]);
        const isUKM = commInfo.length > 0 && commInfo[0].status === 'UKM';
        const initialStatus = isUKM ? 'PENDING' : 'APPROVED';

        // 4. Simpan transaksi
        const [result] = await db.query(
            'INSERT INTO finances (community_id, type, amount, description, transaction_date, approval_status) VALUES (?, ?, ?, ?, ?, ?)',
            [communityId, type, amount || 0, description || null, transaction_date || null, initialStatus]
        );

        res.status(201).json({
            message: initialStatus === 'PENDING' ? 'Pengajuan dana dikirim dan menunggu persetujuan Dosen!' : 'Transaksi berhasil ditambahkan!',
            financeId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambah transaksi.' });
    }
};

// --- FITUR MENGUBAH TRANSAKSI ---
const updateFinance = async (req, res) => {
    const financeId = req.params.financeId;
    const userId = req.user.id;
    const { type, amount, description, transaction_date } = req.body;

    try {
        // 1. Ambil data transaksi untuk mendapatkan community_id
        const [finance] = await db.query('SELECT * FROM finances WHERE id = ?', [financeId]);
        if (finance.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
        }

        const communityId = finance[0].community_id;

        // 2. Otorisasi
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || !['KETUA', 'SEKRETARIS', 'BENDAHARA'].includes(checkRole[0].community_role)) {
            return res.status(403).json({ message: 'Akses ditolak! Hanya pengurus yang bisa mengubah transaksi.' });
        }

        // 3. Update transaksi
        await db.query(
            'UPDATE finances SET type = ?, amount = ?, description = ?, transaction_date = ? WHERE id = ?',
            [type, amount || 0, description || null, transaction_date || null, financeId]
        );

        res.status(200).json({ message: 'Transaksi berhasil diperbarui!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengubah transaksi.' });
    }
};

// --- FITUR MENGHAPUS TRANSAKSI ---
const deleteFinance = async (req, res) => {
    const financeId = req.params.financeId;
    const userId = req.user.id;

    try {
        // 1. Ambil data transaksi untuk mendapatkan community_id
        const [finance] = await db.query('SELECT * FROM finances WHERE id = ?', [financeId]);
        if (finance.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
        }

        const communityId = finance[0].community_id;

        // 2. Otorisasi
        const [checkRole] = await db.query(
            'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
            [userId, communityId]
        );

        if (checkRole.length === 0 || checkRole[0].community_role !== 'KETUA') {
            return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua yang bisa menghapus transaksi.' });
        }

        // 3. Hapus transaksi
        await db.query('DELETE FROM finances WHERE id = ?', [financeId]);

        res.status(200).json({ message: 'Transaksi berhasil dihapus!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus transaksi.' });
    }
};

module.exports = { createFinance, updateFinance, deleteFinance };
