const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ednevnik.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ── Create tables ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    approve_token TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fi TEXT NOT NULL,
    la TEXT NOT NULL,
    cls TEXT NOT NULL DEFAULT '7А',
    em TEXT,
    ph TEXT,
    p1 TEXT,
    p2 TEXT,
    ad TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sid INTEGER NOT NULL,
    sb TEXT NOT NULL,
    gr INTEGER NOT NULL,
    ty TEXT NOT NULL,
    pe TEXT NOT NULL,
    da TEXT NOT NULL,
    te TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sid) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sid INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    UNIQUE(user_id, sid, date),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sid) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS remarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ty TEXT NOT NULL,
    sid INTEGER NOT NULL,
    sb TEXT,
    tx TEXT NOT NULL,
    da TEXT NOT NULL,
    te TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sid) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nm TEXT NOT NULL,
    te TEXT,
    ho INTEGER DEFAULT 2,
    cl TEXT DEFAULT 'sc-math',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fr TEXT NOT NULL,
    su TEXT NOT NULL,
    bo TEXT NOT NULL,
    da TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ti TEXT NOT NULL,
    bo TEXT NOT NULL,
    im TEXT DEFAULT 'Нормална',
    da TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS lesson_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sb TEXT NOT NULL,
    tema TEXT,
    da TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
