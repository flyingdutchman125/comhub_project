const mysql = require('mysql2');
require('dotenv').config();

// Buat connection pool agar lebih efisien
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ubah pool menjadi promise-based agar bisa pakai async/await
const promisePool = pool.promise();

// Tes koneksi
promisePool.getConnection()
    .then(connection => {
        console.log('Berhasil terhubung ke database MySQL ComHub!');
        connection.release();
    })
    .catch(err => {
        console.error('Gagal terhubung ke database:', err.message);
    });

module.exports = promisePool;