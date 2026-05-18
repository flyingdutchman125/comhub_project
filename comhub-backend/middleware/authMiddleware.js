const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization (biasanya berformat: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Akses ditolak! Token tidak ditemukan.' });
    }

    try {
        // Verifikasi token menggunakan secret key dari .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Simpan data user (id & global_role) ke dalam request agar bisa dipakai di controller
        req.user = decoded;

        // Lanjut ke controller yang dituju
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa!' });
    }
};

module.exports = { verifyToken };