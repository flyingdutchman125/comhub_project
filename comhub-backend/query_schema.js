const db = require('./config/db');
async function run() {
    try {
        const [finances] = await db.query('DESCRIBE finances');
        const [projects] = await db.query('DESCRIBE projects');
        console.log("FINANCES:");
        console.log(finances);
        console.log("PROJECTS:");
        console.log(projects);
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
run();
