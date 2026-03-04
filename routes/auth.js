const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// ── GET /signup ───────────────────────────────────────────────
router.get('/signup', (req, res) => {
  if (req.session.userId) return res.redirect('/app');
  res.send(signupPage());
});

// ── POST /signup ──────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, password2 } = req.body;
  if (!name || !email || !password) return res.send(signupPage('Моля попълнете всички полета.'));
  if (password !== password2) return res.send(signupPage('Паролите не съвпадат.'));
  if (password.length < 6) return res.send(signupPage('Паролата трябва да е поне 6 символа.'));

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.send(signupPage('Този имейл вече е регистриран.'));

  const hash = await bcrypt.hash(password, 10);

  db.prepare('INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, 'approved');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userStatus = 'approved';
  res.redirect('/app');
});

// ── GET /login ────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return req.session.userStatus === 'approved' ? res.redirect('/app') : res.redirect('/login');
  }
  res.send(loginPage());
});

// ── POST /login ───────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.send(loginPage('Моля попълнете всички полета.'));

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.send(loginPage('Невалиден имейл или парола.'));

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send(loginPage('Невалиден имейл или парола.'));

  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userStatus = 'approved';

  return res.redirect('/app');
});

// ── GET /logout ───────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ── HTML page helpers ─────────────────────────────────────────
function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Е-Дневник</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.card{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);width:100%;max-width:420px;overflow:hidden;}
.card-header{background:#1e2a38;padding:28px 32px 24px;text-align:center;}
.logo{display:inline-flex;align-items:center;gap:10px;margin-bottom:8px;}
.logo-icon{width:40px;height:40px;border-radius:10px;background:#2dbfad;display:flex;align-items:center;justify-content:center;font-size:20px;}
.logo-name{font-size:22px;font-weight:800;color:#fff;}
.card-subtitle{color:rgba(255,255,255,0.5);font-size:13px;}
.card-body{padding:28px 32px;}
.form-grp{margin-bottom:16px;}
label{display:block;font-size:11.5px;font-weight:600;color:#546e7a;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px;}
input{width:100%;padding:10px 13px;border:1.5px solid #dde2e8;border-radius:7px;font-family:inherit;font-size:13px;outline:none;transition:border-color .15s;}
input:focus{border-color:#2dbfad;}
.btn{width:100%;padding:11px;border:none;border-radius:7px;background:#2dbfad;color:#fff;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s;margin-top:4px;}
.btn:hover{background:#1a9e8e;}
.error{background:#ffebee;color:#c62828;border:1px solid #ffcdd2;border-radius:6px;padding:10px 14px;font-size:12.5px;margin-bottom:16px;}
.link-row{text-align:center;margin-top:18px;font-size:12.5px;color:#546e7a;}
.link-row a{color:#2dbfad;font-weight:600;text-decoration:none;}
.link-row a:hover{text-decoration:underline;}
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div class="logo">
      <div class="logo-icon">📚</div>
      <div class="logo-name">Е-Дневник</div>
    </div>
    <div class="card-subtitle">ОУ „Христо Ботев"</div>
  </div>
  <div class="card-body">${body}</div>
</div>
</body></html>`;
}

function loginPage(err = '') {
  return shell('Вход', `
    <h2 style="font-size:18px;font-weight:700;margin-bottom:4px;">Добре дошли</h2>
    <p style="font-size:12.5px;color:#7a8fa6;margin-bottom:20px;">Влезте в профила си</p>
    ${err ? `<div class="error">${err}</div>` : ''}
    <form method="POST" action="/login">
      <div class="form-grp"><label>Имейл</label><input type="email" name="email" placeholder="teacher@school.bg" required autofocus></div>
      <div class="form-grp"><label>Парола</label><input type="password" name="password" placeholder="••••••••" required></div>
      <button class="btn" type="submit">→ Вход</button>
    </form>
    <div class="link-row">Нямате профил? <a href="/signup">Регистрирайте се</a></div>
  `);
}

function signupPage(err = '') {
  return shell('Регистрация', `
    <h2 style="font-size:18px;font-weight:700;margin-bottom:4px;">Създайте профил</h2>
    <p style="font-size:12.5px;color:#7a8fa6;margin-bottom:20px;">Регистрирайте се за достъп</p>
    ${err ? `<div class="error">${err}</div>` : ''}
    <form method="POST" action="/signup">
      <div class="form-grp"><label>Трите имена</label><input type="text" name="name" placeholder="Иван Петров" required autofocus></div>
      <div class="form-grp"><label>Имейл</label><input type="email" name="email" placeholder="teacher@school.bg" required></div>
      <div class="form-grp"><label>Парола</label><input type="password" name="password" placeholder="Поне 6 символа" required></div>
      <div class="form-grp"><label>Повторете паролата</label><input type="password" name="password2" placeholder="••••••••" required></div>
      <button class="btn" type="submit">✓ Регистрирай се</button>
    </form>
    <div class="link-row">Вече имате профил? <a href="/login">Влезте тук</a></div>
  `);
}

module.exports = router;
