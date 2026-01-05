const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'reports.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    photo_path TEXT,
    reporter_first_name TEXT,
    reporter_last_name TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const columns = db.prepare('PRAGMA table_info(reports)').all().map((col) => col.name);
if (!columns.includes('reporter_first_name')) {
  db.exec('ALTER TABLE reports ADD COLUMN reporter_first_name TEXT');
}
if (!columns.includes('reporter_last_name')) {
  db.exec('ALTER TABLE reports ADD COLUMN reporter_last_name TEXT');
}

function insertReport(report) {
  const stmt = db.prepare(`
    INSERT INTO reports (id, category, description, address, lat, lng, photo_path, status, created_at)
    VALUES (@id, @category, @description, @address, @lat, @lng, @photo_path, @status, @created_at)
  `);
  stmt.run(report);
  return report;
}

function listReports({ status, category, q, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const params = { limit, offset };

  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }

  if (category) {
    conditions.push('category = @category');
    params.category = category;
  }

  if (q) {
    conditions.push('(description LIKE @q OR address LIKE @q)');
    params.q = `%${q}%`;
  }

  let sql = 'SELECT * FROM reports';
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC LIMIT @limit OFFSET @offset';

  return db.prepare(sql).all(params);
}

function updateReportStatus(id, status) {
  const stmt = db.prepare('UPDATE reports SET status = @status WHERE id = @id');
  const result = stmt.run({ id, status });
  return result.changes > 0;
}

function getReportById(id) {
  const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  insertReport,
  listReports,
  updateReportStatus,
  getReportById,
};
