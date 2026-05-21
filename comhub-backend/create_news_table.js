const db = require('./config/db');

async function fix() {
    try {
        console.log('Altering communities table to add primary key and auto_increment...');
        // Let's check if id already has primary key or not
        const [keys] = await db.query("SHOW KEYS FROM communities WHERE Key_name = 'PRIMARY'");
        if (keys.length === 0) {
            // No primary key, let's add it
            // First check if there's auto_increment or if we can just set it
            await db.query('ALTER TABLE communities MODIFY id INT AUTO_INCREMENT PRIMARY KEY');
            console.log('Successfully added PRIMARY KEY and AUTO_INCREMENT to communities(id)!');
        } else {
            console.log('communities table already has a PRIMARY KEY');
        }

        // Now let's try to create the news table again
        console.log('Creating news table...');
        await db.query(`
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
        console.log('News table created successfully!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

fix();
