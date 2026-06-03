const bcrypt = require('bcrypt');
const db = require('./config/db');

async function seed() {
    try {
        console.log('Menghapus data lama (opsional, comment jika tidak mau)...');
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE projects');
        await db.query('TRUNCATE TABLE finances');
        await db.query('TRUNCATE TABLE attendances');
        await db.query('TRUNCATE TABLE attendance_sessions');
        await db.query('TRUNCATE TABLE community_members');
        await db.query('TRUNCATE TABLE communities');
        await db.query('TRUNCATE TABLE users');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        console.log('Membuat data Kemahasiswaan...');
        const [kemahasiswaan] = await db.query(
            `INSERT INTO users (nama, email, password, global_role) VALUES (?, ?, ?, ?)`,
            ['Bapak Budi (Bagian Kemahasiswaan)', 'kemahasiswaan@univ.edu', passwordHash, 'KEMAHASISWAAN']
        );
        const kemahasiswaanId = kemahasiswaan.insertId;

        console.log('Membuat 5 data Dosen...');
        const dosenNames = ['Dr. Andi Setiawan', 'Siti Aminah, M.Kom', 'Bambang Pratama, M.T', 'Dr. Rina Puspita', 'Ir. Johan Kusuma'];
        const dosenIds = [];
        for (let i = 0; i < dosenNames.length; i++) {
            const email = dosenNames[i].split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + `${i+1}@univ.edu`;
            const [dosen] = await db.query(
                `INSERT INTO users (nama, email, password, global_role) VALUES (?, ?, ?, ?)`,
                [dosenNames[i], email, passwordHash, 'DOSEN']
            );
            dosenIds.push(dosen.insertId);
        }

        console.log('Membuat 20 data Mahasiswa...');
        const mhsNames = [
            'Reza Saputra', 'Dinda Ayu', 'Bagas Putra', 'Citra Kirana', 'Fikri Haikal',
            'Gita Saraswati', 'Hadi Sucipto', 'Intan Permatasari', 'Julian Anwar', 'Kiki Amalia',
            'Lukman Hakim', 'Maya Lestari', 'Nanda Rizky', 'Oky Setiawan', 'Putri Larasati',
            'Raka Pradana', 'Rizky Febian', 'Sinta Nuriyah', 'Tito Karnavian', 'Umar Wirahadi'
        ];
        const mhsIds = [];
        for (let i = 0; i < mhsNames.length; i++) {
            const email = mhsNames[i].split(' ')[0].toLowerCase() + `${i+1}@univ.edu`;
            const [mhs] = await db.query(
                `INSERT INTO users (nama, email, password, global_role) VALUES (?, ?, ?, ?)`,
                [mhsNames[i], email, passwordHash, 'MAHASISWA']
            );
            mhsIds.push(mhs.insertId);
        }

        console.log('Membuat 5 Komunitas Biasa...');
        const biasaComms = [
            { name: 'Klub Robotik', desc: 'Komunitas berkumpulnya mahasiswa pecinta robotika dan teknologi otomasi.' },
            { name: 'Komunitas Fotografi', desc: 'Wadah bagi mahasiswa yang memiliki minat dalam dunia fotografi dan videografi.' },
            { name: 'English Debate Club', desc: 'Komunitas yang melatih kemampuan debat dan public speaking dalam bahasa Inggris.' },
            { name: 'Teater Mahasiswa', desc: 'Tempat berkreasi dan berekspresi melalui seni peran dan pementasan teater.' },
            { name: 'Komunitas Pecinta Alam', desc: 'Perkumpulan mahasiswa yang peduli dengan pelestarian lingkungan dan alam.' }
        ];
        
        const commIds = [];
        for (let i = 0; i < biasaComms.length; i++) {
            const [comm] = await db.query(
                `INSERT INTO communities (nama_komunitas, deskripsi, created_at) VALUES (?, ?, CURRENT_DATE)`,
                [biasaComms[i].name, biasaComms[i].desc]
            );
            const commId = comm.insertId;
            commIds.push(commId);

            // Tambah ketua
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'KETUA', 'AKTIF', 0)`,
                [mhsIds[i], commId]
            );
            // Tambah 2 anggota
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'ANGGOTA', 'AKTIF', 0)`,
                [mhsIds[i + 5], commId]
            );
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'ANGGOTA', 'AKTIF', 0)`,
                [mhsIds[i + 10], commId]
            );
            
            // Tambah 1 kegiatan dengan 50% absensi
            await db.query(
                `INSERT INTO attendance_sessions (community_id, session_date, title) VALUES (?, CURRENT_DATE, 'Kumpul Rutin Anggota')`,
                [commId]
            );
            const [session] = await db.query(`SELECT id FROM attendance_sessions WHERE community_id = ? ORDER BY id DESC LIMIT 1`, [commId]);
            await db.query(
                `INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'HADIR')`,
                [session[0].id, mhsIds[i]]
            );
            await db.query(
                `INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'ALFA')`,
                [session[0].id, mhsIds[i + 5]]
            );

            // Keuangan (sedikit pemasukan)
            await db.query(
                `INSERT INTO finances (community_id, type, amount, description, transaction_date, approval_status) VALUES (?, 'INCOME', 150000, 'Uang Kas Bulanan', CURRENT_DATE, 'APPROVED')`,
                [commId]
            );

            // Proyek (1 saja)
            await db.query(
                `INSERT INTO projects (community_id, nama_proker, progress, start_date, end_date, approval_status, anggaran) VALUES (?, 'Orientasi Anggota Baru', 100, CURRENT_DATE, CURRENT_DATE, 'APPROVED', 50000)`,
                [commId]
            );
        }

        console.log('Membuat 5 Komunitas Siap UKM...');
        const ukmReadyComms = [
            { name: 'Gita Buana Choir', desc: 'Komunitas paduan suara mahasiswa yang rutin mengikuti kompetisi nasional.' },
            { name: 'Klub Basket Mahasiswa', desc: 'Klub basket yang telah memenangkan berbagai turnamen tingkat universitas.' },
            { name: 'Esports Arena', desc: 'Komunitas atlet esports yang berprestasi di tingkat regional dan nasional.' },
            { name: 'Klub Kewirausahaan', desc: 'Mewadahi mahasiswa yang memiliki bisnis dan start-up dengan omset stabil.' },
            { name: 'Pers Kampus', desc: 'Media pers mahasiswa yang aktif menerbitkan buletin dan berita kampus.' }
        ];

        for (let i = 0; i < ukmReadyComms.length; i++) {
            const [comm] = await db.query(
                `INSERT INTO communities (nama_komunitas, deskripsi, created_at) VALUES (?, ?, DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR))`,
                [ukmReadyComms[i].name, ukmReadyComms[i].desc]
            );
            const commId = comm.insertId;

            // Tambah ketua
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'KETUA', 'AKTIF', 5)`,
                [mhsIds[19 - i], commId]
            );
            // Tambah 2 anggota
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'ANGGOTA', 'AKTIF', 4)`,
                [mhsIds[14 - i], commId]
            );
            await db.query(
                `INSERT INTO community_members (user_id, community_id, community_role, status_keanggotaan, rating) VALUES (?, ?, 'ANGGOTA', 'AKTIF', 5)`,
                [mhsIds[9 - i], commId]
            );
            
            // Tambah kegiatan (100% absensi)
            await db.query(
                `INSERT INTO attendance_sessions (community_id, session_date, title) VALUES (?, DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 'Rapat Persiapan Acara Besar')`,
                [commId]
            );
            const [session] = await db.query(`SELECT id FROM attendance_sessions WHERE community_id = ? ORDER BY id DESC LIMIT 1`, [commId]);
            await db.query(`INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'HADIR')`, [session[0].id, mhsIds[19 - i]]);
            await db.query(`INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'HADIR')`, [session[0].id, mhsIds[14 - i]]);
            await db.query(`INSERT INTO attendances (session_id, user_id, status) VALUES (?, ?, 'HADIR')`, [session[0].id, mhsIds[9 - i]]);

            // Keuangan (banyak pemasukan)
            await db.query(
                `INSERT INTO finances (community_id, type, amount, description, transaction_date, approval_status) VALUES (?, 'INCOME', 7500000, 'Dana Sponsor Tahunan', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 'APPROVED')`,
                [commId]
            );

            // Proyek (3 selesai)
            for(let p = 1; p <= 3; p++) {
                const prokers = ['Lomba Tingkat Nasional', 'Seminar Kampus', 'Workshop Skill-Up'];
                await db.query(
                    `INSERT INTO projects (community_id, nama_proker, progress, start_date, end_date, approval_status, anggaran) VALUES (?, ?, 100, DATE_SUB(CURRENT_DATE, INTERVAL ? MONTH), DATE_SUB(CURRENT_DATE, INTERVAL ? MONTH), 'APPROVED', 2500000)`,
                    [commId, prokers[p-1], p+1, p]
                );
            }
        }

        console.log('Seed dummy data berhasil dengan nama yang realistis!');
    } catch(err) {
        console.error('Terjadi error saat seed data:', err);
    }
    process.exit(0);
}
seed();
