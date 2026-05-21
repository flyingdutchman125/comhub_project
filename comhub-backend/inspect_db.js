const db = require('./config/db');

async function inspect() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        for (let tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [res] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
            console.log(`=== ${tableName} ===\n`, res[0]['Create Table']);
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspect();
