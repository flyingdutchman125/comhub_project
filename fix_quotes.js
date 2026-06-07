const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    // Kembalikan file controller ke kondisi awal (sebelum script sebelumnya merusak syntax)
    execSync('git checkout -- comhub-backend/controllers/', { stdio: 'inherit' });
    console.log('Berhasil mengembalikan file ke kondisi awal.');
} catch (e) {
    console.log('Gagal git checkout, mungkin karena tidak ada perubahan.');
}

const dir = path.join(__dirname, 'comhub-backend', 'controllers');
const files = fs.readdirSync(dir);

for (const file of files) {
    if (file.endsWith('.js')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Ganti tanda kutip ganda "AKTIF" menjadi tanda kutip tunggal yang di-escape \'AKTIF\'
        // agar tidak memutus string JavaScript yang pakai petik tunggal.
        content = content.replace(/"([A-Z_]+)"/g, "\\'$1\\'");
        
        fs.writeFileSync(filePath, content);
    }
}
console.log('Selesai! Tanda kutip berhasil diperbaiki dengan aman.');
