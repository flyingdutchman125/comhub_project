const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// --- FITUR REGISTER ---
const register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // 1. Cek apakah email sudah terdaftar
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan user ke database
        const [result] = await db.query(
            'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
            [nama, email, hashedPassword]
        );

        res.status(201).json({
            message: 'Registrasi berhasil!',
            userId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// --- FITUR LOGIN ---
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Cari user berdasarkan email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Akun tidak ditemukan!' });
        }

        const user = users[0];

        // 2. Bandingkan password yang dikirim dengan password di database
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Password salah!' });
        }

        // 3. Ambil data membership komunitas user
        const [memberships] = await db.query(`
            SELECT cm.community_id, cm.community_role, cm.status_keanggotaan, c.nama_komunitas
            FROM community_members cm
            JOIN communities c ON cm.community_id = c.id
            WHERE cm.user_id = ? AND cm.status_keanggotaan IN ('AKTIF', 'MENUNGGU_SELEKSI')
        `, [user.id]);

        // 4. Buat token JWT (berisi id dan global_role)
        const token = jwt.sign(
            { id: user.id, role: user.global_role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token berlaku 7 hari
        );

        res.status(200).json({
            message: 'Login berhasil!',
            token: token,
            user: {
                id: user.id,
                nama: user.nama,
                role: user.global_role,
                memberships: memberships
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

// --- FITUR LOGOUT ---
const logout = async (req, res) => {
    // Logout di sisi server bisa dilakukan dengan:
    // 1. Menambahkan token ke blacklist (opsional)
    // 2. Menghapus session user (jika menggunakan session)
    // 3. Mengirim respon sukses (client yang menghapus token dari localStorage)

    // Untuk implementasi sederhana, kita hanya mengirim respon sukses
    res.status(200).json({ message: 'Logout berhasil!' });
};
// --- FITUR GANTI PASSWORD ---
const changePassword = async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    try {
        // 1. Ambil data user saat ini
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const user = users[0];

        // 2. Bandingkan password lama
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Password lama salah!' });
        }

        // 3. Hash password baru
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update password di database
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

        res.status(200).json({ message: 'Password berhasil diperbarui!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengganti password' });
    }
};

module.exports = { register, login, logout, changePassword };