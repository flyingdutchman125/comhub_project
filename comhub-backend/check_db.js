const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('DESCRIBE communities');
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
