const db = require('./config/db');
async function check() {
  const [tables] = await db.query('SHOW TABLES');
  console.log(tables);
  process.exit(0);
}
check();
