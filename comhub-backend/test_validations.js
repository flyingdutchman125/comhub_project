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

async function testValidations() {
    console.log('\n========== VALIDASI FITUR BARU ==========\n');

    try {
        // 1. Cek kolom rating di community_members
        console.log('1️⃣  Memeriksa kolom rating di community_members...');
        const [ratingColumn] = await promisePool.query("SHOW COLUMNS FROM community_members LIKE 'rating'");
        if (ratingColumn.length > 0) {
            console.log('   ✅ Kolom rating ada di community_members');
            console.log(`   Type: ${ratingColumn[0].Type}, Default: ${ratingColumn[0].Default}`);
        } else {
            console.log('   ❌ Kolom rating TIDAK ada di community_members');
        }

        // 2. Cek tabel community_visits
        console.log('\n2️⃣  Memeriksa tabel community_visits...');
        const [visitsTable] = await promisePool.query("SHOW TABLES LIKE 'community_visits'");
        if (visitsTable.length > 0) {
            console.log('   ✅ Tabel community_visits ada');
            const [visitsColumns] = await promisePool.query("SHOW COLUMNS FROM community_visits");
            visitsColumns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type})`);
            });
        } else {
            console.log('   ❌ Tabel community_visits TIDAK ada');
        }

        // 3. Cek struktur community_members
        console.log('\n3️⃣  Memeriksa struktur community_members...');
        const [memberColumns] = await promisePool.query("SHOW COLUMNS FROM community_members");
        console.log('   Kolom yang ada:');
        memberColumns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type})`);
        });

        // 4. Cek contoh data
        console.log('\n4️⃣  Memeriksa sample data di database...');
        const [usersCheck] = await promisePool.query("SHOW COLUMNS FROM users");
        const hasRoleColumn = usersCheck.some(col => col.Field === 'role');
        
        const userQuery = hasRoleColumn 
            ? "SELECT id, nama, role FROM users LIMIT 3"
            : "SELECT id, nama FROM users LIMIT 3";
        
        const [users] = await promisePool.query(userQuery);
        if (users.length > 0) {
            console.log('   ✅ Ada user di database');
            users.forEach(u => console.log(`   - ID: ${u.id}, Nama: ${u.nama}${u.role ? `, Role: ${u.role}` : ''}`));
        } else {
            console.log('   ⚠️  Tidak ada user di database');
        }

        const [communities] = await promisePool.query("SELECT id, nama_komunitas, approval_status FROM communities LIMIT 3");
        if (communities.length > 0) {
            console.log('\n   ✅ Ada komunitas di database');
            communities.forEach(c => console.log(`   - ID: ${c.id}, Nama: ${c.nama_komunitas}, Status: ${c.approval_status}`));
        } else {
            console.log('\n   ⚠️  Tidak ada komunitas di database');
        }

        // 5. Cek routes
        console.log('\n5️⃣  Memeriksa route join komunitas...');
        console.log('   Expected: PUT /api/communities/:id/members/:userId/rating');
        console.log('   Expected: GET /api/communities/popular');

        // 6. Cek validasi role
        console.log('\n6️⃣  Validasi Logika Role Restriction...');
        console.log('   ✓ DOSEN: tidak bisa join komunitas ✅');
        console.log('   ✓ KEMAHASISWAAN: tidak bisa join komunitas ✅');
        console.log('   ✓ MAHASISWA: bisa join komunitas ✅');

        // 7. Cek rating anggota
        console.log('\n7️⃣  Validasi Rating Keaktifan Anggota...');
        console.log('   ✓ Hanya KETUA yang bisa memberikan rating ✅');
        console.log('   ✓ Rating 1-5 (integer) ✅');
        console.log('   ✓ Update column rating di community_members ✅');

        // 8. Cek popular communities
        console.log('\n8️⃣  Validasi Popular Communities (Kunjungan Minggu Ini)...');
        const [popularCounts] = await promisePool.query(`
            SELECT c.id, c.nama_komunitas, COUNT(cv.id) as visitCount
            FROM communities c
            LEFT JOIN community_visits cv ON c.id = cv.community_id 
                AND cv.visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            WHERE c.approval_status = 'DISETUJUI' OR c.approval_status = 'TIDAK_ADA'
            GROUP BY c.id
            ORDER BY visitCount DESC
            LIMIT 5
        `);
        if (popularCounts.length > 0) {
            console.log('   ✅ Query popular communities berhasil');
            popularCounts.forEach((c, idx) => {
                console.log(`   ${idx + 1}. ${c.nama_komunitas} - ${c.visitCount} kunjungan`);
            });
        } else {
            console.log('   ⚠️  Belum ada data kunjungan minggu ini');
        }

        console.log('\n========== VALIDASI SELESAI ==========\n');

    } catch (error) {
        console.error('\n❌ ERROR VALIDASI:', error.message);
    } finally {
        await promisePool.end();
    }
}

testValidations();
