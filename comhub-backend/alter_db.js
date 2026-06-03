const db = require('./config/db');

async function run() {
    try {
        console.log('Menambahkan kolom approval_status pada tabel projects...');
        await db.query(`ALTER TABLE projects ADD COLUMN approval_status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED'`);
        console.log('Berhasil menambahkan pada tabel projects.');
    } catch (e) {
        console.log('Mungkin sudah ada (projects):', e.message);
    }
    
    try {
        console.log('Menambahkan kolom approval_status pada tabel finances...');
        await db.query(`ALTER TABLE finances ADD COLUMN approval_status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED'`);
        console.log('Berhasil menambahkan pada tabel finances.');
    } catch (e) {
        console.log('Mungkin sudah ada (finances):', e.message);
    }

    process.exit(0);
}

run();
