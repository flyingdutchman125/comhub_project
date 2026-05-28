const db = require('./config/db');
async function check() {
  const [finances] = await db.query('DESCRIBE finances');
  console.log('finances', finances);
  const [projects] = await db.query('DESCRIBE projects');
  console.log('projects', projects);
  const [attendances] = await db.query('DESCRIBE attendances');
  console.log('attendances', attendances);
  const [attendance_sessions] = await db.query('DESCRIBE attendance_sessions');
  console.log('attendance_sessions', attendance_sessions);
  process.exit(0);
}
check();
