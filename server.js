require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');

const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/app');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
  },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', appRoutes);

// Redirect root to login
app.get('/', (req, res) => {
  if (req.session.userId && req.session.userStatus === 'approved') return res.redirect('/app');
  res.redirect('/login');
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Е-Дневник работи на http://localhost:${PORT}`);
});
