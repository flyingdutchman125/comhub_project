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

            console.log('Memastikan kolom logo di tabel communities dapat menampung Base64...');
            try {
                await promisePool.query('ALTER TABLE communities MODIFY COLUMN logo LONGTEXT');
                console.log('Berhasil memperbarui kolom logo menjadi LONGTEXT.');
            } catch (err) {
                console.log('Gagal memperbarui kolom logo:', err.message);
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

            console.log('Memeriksa dan membuat tabel project_discussions...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS project_discussions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    project_id INT NOT NULL,
                    user_id INT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            
            const [columnsDisc] = await promisePool.query("SHOW COLUMNS FROM project_discussions LIKE 'is_edited'");
            if (columnsDisc.length === 0) {
                await promisePool.query('ALTER TABLE project_discussions ADD COLUMN is_edited BOOLEAN DEFAULT FALSE');
            }
            console.log('Inisialisasi tabel project_discussions selesai.');

            console.log('Memeriksa dan membuat tabel project_discussion_reads...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS project_discussion_reads (
                    message_id INT NOT NULL,
                    user_id INT NOT NULL,
                    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (message_id, user_id),
                    FOREIGN KEY (message_id) REFERENCES project_discussions(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel project_discussion_reads selesai.');

            console.log('Memeriksa dan membuat tabel community_reviews...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS community_reviews (
                    community_id INT NOT NULL,
                    user_id INT NOT NULL,
                    rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (community_id, user_id),
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel community_reviews selesai.');

            console.log('Memeriksa dan membuat tabel community_visits...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS community_visits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    community_id INT NOT NULL,
                    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel community_visits selesai.');

            console.log('Memeriksa kolom rating pada tabel community_members...');
            const [communityMembersTable] = await promisePool.query("SHOW TABLES LIKE 'community_members'");
            if (communityMembersTable.length > 0) {
                const [columnsRating] = await promisePool.query("SHOW COLUMNS FROM community_members LIKE 'rating'");
                if (columnsRating.length === 0) {
                    await promisePool.query('ALTER TABLE community_members ADD COLUMN rating INT DEFAULT NULL');
                    console.log('Kolom rating berhasil ditambahkan ke tabel community_members.');
                } else {
                    console.log('Kolom rating sudah ada di tabel community_members.');
                }
            } else {
                console.log('Tabel community_members belum ada; lewati penambahan kolom rating.');
            }

            console.log('Memeriksa dan membuat tabel notification_categories...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS notification_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT,
                    icon VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel notification_categories selesai.');

            console.log('Memeriksa dan membuat tabel notification_types...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS notification_types (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    category_id INT NOT NULL,
                    description TEXT,
                    icon VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES notification_categories(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel notification_types selesai.');

            console.log('Memeriksa dan membuat tabel notifications...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    community_id INT NOT NULL,
                    type_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    data JSON DEFAULT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    read_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
                    FOREIGN KEY (type_id) REFERENCES notification_types(id) ON DELETE CASCADE,
                    INDEX idx_user_read (user_id, is_read),
                    INDEX idx_created (created_at DESC)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel notifications selesai.');

            console.log('Memeriksa dan membuat tabel tasks...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS tasks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    community_id INT NOT NULL,
                    assigned_by INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
                    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
                    due_date DATE DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_community (community_id),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel tasks selesai.');

            console.log('Memeriksa dan membuat tabel task_assignments...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS task_assignments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    task_id INT NOT NULL,
                    user_id INT NOT NULL,
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP NULL,
                    notes TEXT,
                    UNIQUE KEY unique_task_user (task_id, user_id),
                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel task_assignments selesai.');

            console.log('Memeriksa dan membuat tabel community_changes...');
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS community_changes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    community_id INT NOT NULL,
                    changed_by INT NOT NULL,
                    change_type VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    old_value JSON DEFAULT NULL,
                    new_value JSON DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
                    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_community (community_id),
                    INDEX idx_created (created_at DESC)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('Inisialisasi tabel community_changes selesai.');

        } catch (initErr) {
            console.error('Error saat inisialisasi database:', initErr.message);
        }
    })
    .catch(err => {
        console.error('Gagal terhubung ke database:', err.message);
    });

module.exports = promisePool;