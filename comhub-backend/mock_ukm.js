const db = require('./config/db');

async function mock() {
    try {
        const [comm] = await db.query('SELECT * FROM communities WHERE nama_komunitas LIKE "%photo%" OR nama_komunitas LIKE "%potho%"');
        if (comm.length === 0) {
            console.log('Komunitas tidak ditemukan');
            process.exit(0);
        }
        
        const commId = comm[0].id;
        console.log('Mengubah data untuk komunitas:', comm[0].nama_komunitas, 'ID:', commId);

        // 1. Umur komunitas 3 tahun
        await db.query(`UPDATE communities SET created_at = DATE_SUB(CURRENT_DATE, INTERVAL 4 YEAR) WHERE id = ?`, [commId]);

        // 2. Absensi 100% (Buat 1 session dan 1 hadir)
        await db.query(`INSERT INTO attendance_sessions (community_id, session_date, title) VALUES (?, DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Rutin')`, [commId]);
        const [session] = await db.query(`SELECT id FROM attendance_sessions WHERE community_id = ? ORDER BY id DESC LIMIT 1`, [commId]);
        
        // Asumsi user 1 ada di member (Ambil salah satu member aktif bukan ketua)
        const [members] = await db.query(`SELECT user_id FROM community_members WHERE community_id = ? AND status_keanggotaan = 'AKTIF' AND community_role != 'KETUA' LIMIT 1`, [commId]);
        
        let userIdToUse = null;
        if (members.length > 0) {
            userIdToUse = members[0].user_id;
            // 5. Rating aktif > 3
            await db.query(`UPDATE community_members SET rating = 5 WHERE user_id = ? AND community_id = ?`, [userIdToUse, commId]);
        } else {
            console.log('WARNING: Tidak ada member aktif (selain KETUA) untuk absensi & rating. Harus buat dummy member.');
            // Buat user dummy jika tidak ada
            const [u] = await db.query(`INSERT INTO users (nama, email, password, role) VALUES ('Dummy Member', 'dummy@member.com', '123', 'MAHASISWA')`);
            userIdToUse = u.insertId;
            await db.query(`INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'ANGGOTA', 'AKTIF', 5)`, [userIdToUse, commId]);
        }

        await db.query(`INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'HADIR')`, [session[0].id, userIdToUse]);

        // 3. Keuangan Pemasukan > Pengeluaran
        await db.query(`INSERT INTO finances (community_id, type, amount, description, transaction_date, approval_status) VALUES (?, 'INCOME', 1000000, 'Dana Dummy', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'APPROVED')`, [commId]);

        // 4. 3 Proyek Terlaksana
        for(let i=1; i<=3; i++) {
            await db.query(`INSERT INTO projects (community_id, nama_proker, progress, start_date, end_date, approval_status, anggaran) VALUES (?, ?, 100, DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'APPROVED', 500000)`, [commId, 'Proyek Selesai ' + i]);
        }

        console.log('Berhasil mock data untuk syarat UKM!');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

mock();
