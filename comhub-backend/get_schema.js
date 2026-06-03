const db = require('./config/db');
async function run() {
    try {
        const tables = ['users', 'communities', 'community_members', 'attendance_sessions', 'attendances', 'finances', 'projects'];
        for (let table of tables) {
            const [desc] = await db.query(`DESCRIBE ${table}`);
            console.log(`\n--- ${table} ---`);
            console.log(desc.map(d => `${d.Field} (${d.Type})`).join('\n'));
        }
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
