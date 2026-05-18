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

        // 3. Buat token JWT (berisi id dan global_role)
        const token = jwt.sign(
            { id: user.id, role: user.global_role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token berlaku 1 hari
        );

        res.status(200).json({
            message: 'Login berhasil!',
            token: token,
            user: {
                id: user.id,
                nama: user.nama,
                role: user.global_role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

module.exports = { register, login };