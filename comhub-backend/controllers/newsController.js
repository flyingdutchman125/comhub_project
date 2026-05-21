const db = require('../config/db');

// Get all news posts, joined with the author's name and community name if present
const getAllNews = async (req, res) => {
    try {
        const { communityId } = req.query;
        let query = `
            SELECT n.*, u.nama AS author_name, c.nama_komunitas AS community_name 
            FROM news n 
            JOIN users u ON n.author_id = u.id 
            LEFT JOIN communities c ON n.community_id = c.id
        `;
        let params = [];
        if (communityId) {
            query += ` WHERE n.community_id = ? `;
            params.push(communityId);
        }
        query += ` ORDER BY n.created_at DESC `;

        const [news] = await db.query(query, params);
        res.status(200).json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Gagal mengambil berita' });
    }
};

// Create a new news post
const createNews = async (req, res) => {
    try {
        const { title, content, community_id, image } = req.body;
        const author_id = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan isi berita wajib diisi!' });
        }

        if (community_id) {
            // Check if user is KETUA or KADIV in this community
            const [member] = await db.query(
                'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
                [author_id, community_id]
            );
            if (member.length === 0 || !['KETUA', 'KADIV'].includes(member[0].community_role)) {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua atau Kadiv yang diizinkan mengunggah berita komunitas.' });
            }
        } else {
            // Global news - only KEMAHASISWAAN allowed
            if (req.user.role !== 'KEMAHASISWAAN') {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Admin Kemahasiswaan yang diizinkan.' });
            }
        }

        const [result] = await db.query(
            'INSERT INTO news (title, content, author_id, community_id, image) VALUES (?, ?, ?, ?, ?)',
            [title, content, author_id, community_id || null, image || null]
        );

        res.status(201).json({
            message: 'Berita berhasil dipublikasikan!',
            newsId: result.insertId
        });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ message: 'Gagal menambahkan berita' });
    }
};

// Update an existing news post
const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, image } = req.body;
        const userId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan isi berita wajib diisi!' });
        }

        // Fetch news post first
        const [news] = await db.query('SELECT * FROM news WHERE id = ?', [id]);
        if (news.length === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan' });
        }

        const post = news[0];

        if (post.community_id) {
            // Check if user is KETUA or KADIV in this community
            const [member] = await db.query(
                'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
                [userId, post.community_id]
            );
            if (member.length === 0 || !['KETUA', 'KADIV'].includes(member[0].community_role)) {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua atau Kadiv yang diizinkan mengubah berita komunitas.' });
            }
        } else {
            // Global news - only KEMAHASISWAAN allowed
            if (req.user.role !== 'KEMAHASISWAAN') {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Admin Kemahasiswaan yang diizinkan.' });
            }
        }

        await db.query(
            'UPDATE news SET title = ?, content = ?, image = ? WHERE id = ?',
            [title, content, image || null, id]
        );

        res.status(200).json({ message: 'Berita berhasil diperbarui!' });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Gagal memperbarui berita' });
    }
};

// Delete a news post
const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Fetch news post first
        const [news] = await db.query('SELECT * FROM news WHERE id = ?', [id]);
        if (news.length === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan' });
        }

        const post = news[0];

        if (post.community_id) {
            // Check if user is KETUA or KADIV in this community
            const [member] = await db.query(
                'SELECT community_role FROM community_members WHERE user_id = ? AND community_id = ? AND status_keanggotaan = "AKTIF"',
                [userId, post.community_id]
            );
            if (member.length === 0 || !['KETUA', 'KADIV'].includes(member[0].community_role)) {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Ketua atau Kadiv yang diizinkan menghapus berita komunitas.' });
            }
        } else {
            // Global news - only KEMAHASISWAAN allowed
            if (req.user.role !== 'KEMAHASISWAAN') {
                return res.status(403).json({ message: 'Akses ditolak! Hanya Admin Kemahasiswaan yang diizinkan.' });
            }
        }

        await db.query('DELETE FROM news WHERE id = ?', [id]);

        res.status(200).json({ message: 'Berita berhasil dihapus!' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ message: 'Gagal menghapus berita' });
    }
};

module.exports = {
    getAllNews,
    createNews,
    updateNews,
    deleteNews
};
