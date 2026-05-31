const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

async function migrate() {
    try {
        console.log('🔄 Memulai migrasi...\n');

        // 1. Buat tabel community_visits
        console.log('1️⃣  Membuat tabel community_visits...');
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS community_visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                community_id INT NOT NULL,
                visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('   ✅ Tabel community_visits berhasil dibuat/sudah ada\n');

        // 2. Cek kolom rating di community_members
        console.log('2️⃣  Memeriksa kolom rating di community_members...');
        const [communityMembersTable] = await promisePool.query("SHOW TABLES LIKE 'community_members'");
        if (communityMembersTable.length > 0) {
            const [columnsRating] = await promisePool.query("SHOW COLUMNS FROM community_members LIKE 'rating'");
            if (columnsRating.length === 0) {
                await promisePool.query('ALTER TABLE community_members ADD COLUMN rating INT DEFAULT NULL');
                console.log('   ✅ Kolom rating berhasil ditambahkan\n');
            } else {
                console.log('   ✅ Kolom rating sudah ada\n');
            }
        } else {
            console.log('   ⚠️  Tabel community_members belum ada\n');
        }

        // 3. Verifikasi
        console.log('3️⃣  Verifikasi tabel dan kolom...');
        const [tables] = await promisePool.query("SHOW TABLES LIKE 'community_visits'");
        if (tables.length > 0) {
            const [columns] = await promisePool.query("SHOW COLUMNS FROM community_visits");
            console.log('   ✅ Tabel community_visits ada dengan kolom:');
            columns.forEach(col => console.log(`      - ${col.Field} (${col.Type})`));
        }

        const [memberColumns] = await promisePool.query("SHOW COLUMNS FROM community_members LIKE 'rating'");
        if (memberColumns.length > 0) {
            console.log(`   ✅ Kolom rating ada di community_members (${memberColumns[0].Type})`);
        }

        console.log('\n🎉 Migrasi selesai dengan sukses!\n');

    } catch (error) {
        console.error('\n❌ Error migrasi:', error.message);
        process.exit(1);
    } finally {
        await promisePool.end();
    }
}

migrate();
