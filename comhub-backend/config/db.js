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

// Tes koneksi dan inisialisasi tabel database
promisePool.getConnection()
    .then(async (connection) => {
        console.log('Berhasil terhubung ke database MySQL ComHub!');
        connection.release();

        try {
            console.log('Memeriksa struktur tabel communities...');
            const [keys] = await promisePool.query("SHOW KEYS FROM communities WHERE Key_name = 'PRIMARY'");
            if (keys.length === 0) {
                console.log('Menambahkan PRIMARY KEY dan AUTO_INCREMENT ke tabel communities...');
                await promisePool.query('ALTER TABLE communities MODIFY id INT AUTO_INCREMENT PRIMARY KEY');
                console.log('Berhasil menambahkan PRIMARY KEY dan AUTO_INCREMENT ke communities(id)!');
            } else {
                console.log('Tabel communities sudah memiliki PRIMARY KEY.');
            }

            console.log('Memeriksa dan membuat tabel news...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS news (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    author_id INT NOT NULL,
                    community_id INT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel news selesai.');

            console.log('Memeriksa kolom image di tabel news...');
            const [columns] = await promisePool.query("SHOW COLUMNS FROM news LIKE 'image'");
            if (columns.length === 0) {
                console.log('Menambahkan kolom image ke tabel news...');
                await promisePool.query('ALTER TABLE news ADD COLUMN image MEDIUMTEXT DEFAULT NULL');
                console.log('Berhasil menambahkan kolom image ke tabel news!');
            } else {
                console.log('Kolom image di tabel news sudah ada.');
            }

            console.log('Memeriksa kolom community_id di tabel news...');
            const [columnsComm] = await promisePool.query("SHOW COLUMNS FROM news LIKE 'community_id'");
            if (columnsComm.length === 0) {
                console.log('Menambahkan kolom community_id ke tabel news...');
                await promisePool.query('ALTER TABLE news ADD COLUMN community_id INT DEFAULT NULL');
                try {
                    await promisePool.query('ALTER TABLE news ADD CONSTRAINT fk_news_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE');
                    console.log('Berhasil menambahkan kolom community_id dan constraint foreign key ke tabel news!');
                } catch (fkErr) {
                    console.log('Gagal/Sudah ada foreign key constraint:', fkErr.message);
                }
            } else {
                console.log('Kolom community_id di tabel news sudah ada.');
            }

            console.log('Memeriksa dan membuat tabel attendance_sessions...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS attendance_sessions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    community_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    session_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel attendance_sessions selesai.');

            console.log('Memeriksa dan membuat tabel attendances...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS attendances (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    session_id INT NOT NULL,
                    user_id INT NOT NULL,
                    status ENUM('HADIR', 'SAKIT', 'IZIN', 'ALFA') NOT NULL DEFAULT 'ALFA',
                    notes VARCHAR(255) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_session_user (session_id, user_id),
                    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel attendances selesai.');
        } catch (initErr) {
            console.error('Error saat inisialisasi database:', initErr.message);
        }
    })
    .catch(err => {
        console.error('Gagal terhubung ke database:', err.message);
    });

module.exports = promisePool;