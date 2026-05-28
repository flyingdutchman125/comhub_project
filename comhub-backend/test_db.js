const db = require('./config/db');
(async () => {
  try {
    const [c] = await db.query('DESCRIBE communities');
    console.log("COMMUNITIES:", c);
    const [p] = await db.query('DESCRIBE projects');
    console.log("PROJECTS:", p);
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
})();
