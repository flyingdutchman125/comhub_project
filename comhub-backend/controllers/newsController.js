const db = require('../config/db');

// Get all news posts, joined with the author's name
const getAllNews = async (req, res) => {
    try {
        const [news] = await db.query(`
            SELECT n.*, u.nama AS author_name 
            FROM news n 
            JOIN users u ON n.author_id = u.id 
            ORDER BY n.created_at DESC
        `);
        res.status(200).json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Gagal mengambil berita' });
    }
};

// Create a new news post (Only Super Admin/KEMAHASISWAAN allowed)
const createNews = async (req, res) => {
    try {
        const { title, content } = req.body;
        const author_id = req.user.id;

        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan isi berita wajib diisi!' });
        }

        const [result] = await db.query(
            'INSERT INTO news (title, content, author_id) VALUES (?, ?, ?)',
            [title, content, author_id]
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
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Judul dan isi berita wajib diisi!' });
        }

        const [result] = await db.query(
            'UPDATE news SET title = ?, content = ? WHERE id = ?',
            [title, content, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan' });
        }

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

        const [result] = await db.query('DELETE FROM news WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Berita tidak ditemukan' });
        }

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
