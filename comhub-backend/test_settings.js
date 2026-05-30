const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
    { id: 10, role: 'MAHASISWA' },
    process.env.JWT_SECRET || 'rahasia_comhub_super_aman_123',
    { expiresIn: '1d' }
);

async function verify() {
    try {
        console.log('\n--- 1. Testing updateCommunity API for Community 6 (Sipak is KETUA) ---');
        const resComm = await fetch('http://localhost:3000/api/communities/6', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nama_komunitas: 'HIMAKOM PENS (Updated)',
                deskripsi: 'Himpunan Mahasiswa Komputer PENS - Semangat Baru!',
                logo: ''
            })
        });
        const commData = await resComm.json();
        console.log('Update Community Response:', resComm.status, commData);

    } catch (err) {
        console.error('Error during verification:', err);
    }
}

verify();
