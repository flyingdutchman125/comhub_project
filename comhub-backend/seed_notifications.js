const db = require('./config/db');

async function seedNotificationData() {
    try {
        console.log('\n🌱 Seeding notification categories and types...\n');

        // Categories
        const categories = [
            { name: 'UKM', description: 'Notifikasi dari Unit Kegiatan Mahasiswa', icon: '🎓' },
            { name: 'Financial', description: 'Notifikasi keuangan dan pembayaran', icon: '💰' },
            { name: 'Forum', description: 'Notifikasi forum diskusi dan chat', icon: '💬' },
            { name: 'Event', description: 'Notifikasi acara dan kegiatan', icon: '📅' },
            { name: 'Task', description: 'Notifikasi tugas dan assignment', icon: '✅' },
            { name: 'Member', description: 'Notifikasi anggota komunitas', icon: '👥' }
        ];

        for (const category of categories) {
            const [existing] = await db.query(
                'SELECT id FROM notification_categories WHERE name = ?',
                [category.name]
            );

            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO notification_categories (name, description, icon) VALUES (?, ?, ?)',
                    [category.name, category.description, category.icon]
                );
                console.log(`✅ Added category: ${category.name}`);
            } else {
                console.log(`⏭️  Category already exists: ${category.name}`);
            }
        }

        // Get categories
        const [allCategories] = await db.query('SELECT * FROM notification_categories');

        // Types
        const types = [
            // UKM types
            { categoryName: 'UKM', name: 'Member Joined', description: 'Anggota baru bergabung' },
            { categoryName: 'UKM', name: 'Member Left', description: 'Anggota keluar' },
            { categoryName: 'UKM', name: 'Role Changed', description: 'Peran anggota berubah' },
            { categoryName: 'UKM', name: 'UKM Approved', description: 'UKM disetujui' },
            { categoryName: 'UKM', name: 'UKM Rejected', description: 'UKM ditolak' },
            
            // Financial types
            { categoryName: 'Financial', name: 'Payment Reminder', description: 'Pengingat pembayaran' },
            { categoryName: 'Financial', name: 'Payment Received', description: 'Pembayaran diterima' },
            { categoryName: 'Financial', name: 'Report Generated', description: 'Laporan keuangan dibuat' },
            { categoryName: 'Financial', name: 'Budget Alert', description: 'Peringatan anggaran' },
            
            // Forum types
            { categoryName: 'Forum', name: 'New Message', description: 'Pesan baru di forum' },
            { categoryName: 'Forum', name: 'Message Reply', description: 'Balasan pada pesan Anda' },
            { categoryName: 'Forum', name: 'Message Mentioned', description: 'Anda disebutkan dalam pesan' },
            
            // Event types
            { categoryName: 'Event', name: 'Event Created', description: 'Acara baru dibuat' },
            { categoryName: 'Event', name: 'Event Updated', description: 'Acara diperbarui' },
            { categoryName: 'Event', name: 'Event Cancelled', description: 'Acara dibatalkan' },
            
            // Task types
            { categoryName: 'Task', name: 'Task Assignment', description: 'Tugas baru ditugaskan' },
            { categoryName: 'Task', name: 'Task Completed', description: 'Tugas selesai' },
            { categoryName: 'Task', name: 'Task Overdue', description: 'Tugas terlambat' },
            
            // Member types
            { categoryName: 'Member', name: 'Member Approval', description: 'Persetujuan anggota tertunda' },
            { categoryName: 'Member', name: 'Member Rating', description: 'Rating anggota diperbarui' }
        ];

        for (const type of types) {
            const category = allCategories.find(c => c.name === type.categoryName);
            if (!category) continue;

            const [existing] = await db.query(
                'SELECT id FROM notification_types WHERE name = ? AND category_id = ?',
                [type.name, category.id]
            );

            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO notification_types (name, category_id, description) VALUES (?, ?, ?)',
                    [type.name, category.id, type.description]
                );
                console.log(`✅ Added type: ${type.name} (${type.categoryName})`);
            } else {
                console.log(`⏭️  Type already exists: ${type.name}`);
            }
        }

        console.log('\n✨ Seeding complete!\n');

    } catch (error) {
        console.error('Error seeding data:', error.message);
    } finally {
        process.exit(0);
    }
}

seedNotificationData();
