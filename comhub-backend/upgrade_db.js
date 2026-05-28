const db = require('./config/db');
async function upgrade() {
  try {
    await db.query("ALTER TABLE communities ADD COLUMN upgrade_status ENUM('TIDAK_ADA', 'MENUNGGU_DOSEN', 'DITOLAK') DEFAULT 'TIDAK_ADA'");
    console.log("Alter table successful");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists, skipping.");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}
upgrade();
