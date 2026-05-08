const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────
// Smart path detection:
// Docker (production) → save to /app/data
// Local development   → save to current folder
//
// Why different paths?
// Docker: /app/data is mounted to named volume
//         Data survives container restarts! ✅
// Local:  Just save next to database.js
// ─────────────────────────────────────────
const dataDir = process.env.NODE_ENV === 'production'
  ? '/app/data'
  : __dirname;

// Create directory if it doesn't exist
// recursive: true = create parent folders too
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'database.sqlite'));

db.pragma('journal_mode = WAL');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
  )
`);

// Todos table with user ownership
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    completed  INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log('✅ Database connected:', path.join(dataDir, 'database.sqlite'));

module.exports = db;