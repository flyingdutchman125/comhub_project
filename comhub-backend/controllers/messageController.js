const db = require('../config/db');

// --- MENGIRIM PESAN ---
const sendMessage = async (req, res) => {
    const senderId = req.user.id;
    const { receiver_id, subject, content, type = 'NORMAL', community_id = null, role_offered = null } = req.body;

    if (!receiver_id || !subject || !content) {
        return res.status(400).json({ message: 'Semua field wajib diisi' });
    }

    try {
        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, subject, content, type, community_id, role_offered) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [senderId, receiver_id, subject, content, type, community_id, role_offered]
        );
        res.status(201).json({ message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengirim pesan' });
    }
};

// --- MENGAMBIL PESAN MASUK (INBOX) ---
const getInbox = async (req, res) => {
    const userId = req.user.id;

    try {
        const [messages] = await db.query(`
            SELECT m.id, m.subject, m.content, m.is_read, m.created_at, 
                   m.type, m.community_id, m.role_offered, m.is_actioned,
                   u.id as sender_id, u.nama as sender_name 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = ?
            ORDER BY m.created_at DESC
        `, [userId]);

        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil pesan' });
    }
};

// --- TANDAI PESAN SUDAH DIBACA ---
const markAsRead = async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;

    try {
        const [result] = await db.query(
            'UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?',
            [messageId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pesan tidak ditemukan atau Anda tidak berhak membacanya' });
        }

        res.status(200).json({ message: 'Pesan ditandai telah dibaca' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

// --- TERIMA PENAWARAN JABATAN ---
const acceptPromotionOffer = async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    try {
        // 1. Validasi pesan
        const [messages] = await db.query('SELECT * FROM messages WHERE id = ? AND receiver_id = ? AND type = "PROMOTION_OFFER" AND is_actioned = FALSE', [messageId, userId]);
        if (messages.length === 0) return res.status(404).json({ message: 'Pesan penawaran tidak valid atau sudah diproses' });
        
        const offer = messages[0];
        const newRole = offer.role_offered;
        const targetCommunityId = offer.community_id;
        
        // 2. Cari semua komunitas lain yang diikuti
        const [otherCommunities] = await db.query(
            'SELECT community_id FROM community_members WHERE user_id = ? AND community_id != ?',
            [userId, targetCommunityId]
        );
        
        // 3. Untuk setiap komunitas lain, kirim pesan pengunduran diri ke Ketuanya, lalu keluar
        for (let comm of otherCommunities) {
            const [ketuas] = await db.query('SELECT user_id FROM community_members WHERE community_id = ? AND community_role = "KETUA" LIMIT 1', [comm.community_id]);
            if (ketuas.length > 0) {
                const ketuaId = ketuas[0].user_id;
                await db.query(
                    'INSERT INTO messages (sender_id, receiver_id, subject, content, type) VALUES (?, ?, ?, ?, "NORMAL")',
                    [userId, ketuaId, 'Pemberitahuan Pengunduran Diri Otomatis', 'Halo Ketua, saya mengundurkan diri dari komunitas ini karena saya telah menerima tawaran sebagai pengurus inti di komunitas lain.']
                );
            }
            // Keluar dari komunitas
            await db.query('DELETE FROM community_members WHERE user_id = ? AND community_id = ?', [userId, comm.community_id]);
        }
        
        // 4. Update role di komunitas target
        await db.query('UPDATE community_members SET community_role = ? WHERE user_id = ? AND community_id = ?', [newRole, userId, targetCommunityId]);
        
        // 5. Tandai pesan sebagai processed
        await db.query('UPDATE messages SET is_actioned = TRUE, is_read = TRUE WHERE id = ?', [messageId]);
        
        res.status(200).json({ message: 'Berhasil menerima jabatan dan keluar dari komunitas lain!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan sistem' });
    }
};

// --- TOLAK PENAWARAN JABATAN ---
const rejectPromotionOffer = async (req, res) => {
    const messageId = req.params.id;
    const userId = req.user.id;
    
    try {
        const [result] = await db.query('UPDATE messages SET is_actioned = TRUE, is_read = TRUE WHERE id = ? AND receiver_id = ? AND type = "PROMOTION_OFFER"', [messageId, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Pesan tidak valid' });
        
        res.status(200).json({ message: 'Penawaran ditolak' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan sistem' });
    }
};

module.exports = {
    sendMessage,
    getInbox,
    markAsRead,
    acceptPromotionOffer,
    rejectPromotionOffer
};
