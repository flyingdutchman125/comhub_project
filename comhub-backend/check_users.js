const db = require('./config/database');
async function check() {
  const [users] = await db.query('DESCRIBE users');
  console.log(users);
  process.exit(0);
}
check();
