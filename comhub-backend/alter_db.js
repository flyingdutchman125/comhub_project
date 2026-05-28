const db = require('./config/db');
async function alter() {
  try {
    await db.query("ALTER TABLE communities ADD COLUMN dosen_pembina_id INT NULL");
    await db.query("ALTER TABLE communities ADD FOREIGN KEY (dosen_pembina_id) REFERENCES users(id) ON DELETE SET NULL");
    await db.query("ALTER TABLE communities ADD COLUMN interview_date DATETIME NULL");
    await db.query("ALTER TABLE communities ADD COLUMN eligibility_notes TEXT NULL");
    console.log("Alter table successful");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist, skipping.");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}
alter();
