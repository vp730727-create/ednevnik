const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { sendApprovalRequest, sendWelcome } = require('../email');

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
  const token = uuidv4();

  db.prepare('INSERT INTO users (name, email, password, status, approve_token) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, hash, 'pending', token);

  // Send approval email to admin
  try {
    await sendApprovalRequest({ name, email, token });
  } catch (e) {
    console.error('Email error:', e.message);
  }

  // Auto-login as pending
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userStatus = 'pending';
  res.redirect('/pending');
});

// ── GET /login ────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return req.session.userStatus === 'approved' ? res.redirect('/app') : res.redirect('/pending');
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
  req.session.userStatus = user.status;

  if (user.status === 'approved') return res.redirect('/app');
  return res.redirect('/pending');
});

// ── GET /logout ───────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ── GET /pending ──────────────────────────────────────────────
router.get('/pending', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.userStatus === 'approved') return res.redirect('/app');
  res.send(pendingPage(req.session.userName));
});

// ── GET /admin/approve/:token ─────────────────────────────────
router.get('/admin/approve/:token', async (req, res) => {
  const { token } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE approve_token = ?').get(token);

  if (!user) {
    return res.send(resultPage('❌ Невалиден линк', 'Този линк за одобрение е невалиден или вече е използван.', false));
  }
  if (user.status === 'approved') {
    return res.send(resultPage('✅ Вече одобрен', `Потребителят ${user.name} вече е одобрен.`, true));
  }

  db.prepare('UPDATE users SET status = ?, approve_token = NULL WHERE id = ?').run('approved', user.id);

  // Update session if this user is currently logged in (edge case)
  try {
    await sendWelcome({ name: user.name, email: user.email });
  } catch (e) {
    console.error('Welcome email error:', e.message);
  }

  res.send(resultPage('✅ Потребителят е одобрен!', `<strong>${user.name}</strong> (${user.email}) вече има достъп до Е-Дневник.`, true));
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
    <p style="font-size:12.5px;color:#7a8fa6;margin-bottom:20px;">Заявете достъп до системата</p>
    ${err ? `<div class="error">${err}</div>` : ''}
    <form method="POST" action="/signup">
      <div class="form-grp"><label>Трите имена</label><input type="text" name="name" placeholder="Иван Петров" required autofocus></div>
      <div class="form-grp"><label>Имейл</label><input type="email" name="email" placeholder="teacher@school.bg" required></div>
      <div class="form-grp"><label>Парола</label><input type="password" name="password" placeholder="Поне 6 символа" required></div>
      <div class="form-grp"><label>Повторете паролата</label><input type="password" name="password2" placeholder="••••••••" required></div>
      <button class="btn" type="submit">✓ Изпратете заявка</button>
    </form>
    <div class="link-row">Вече имате профил? <a href="/login">Влезте тук</a></div>
  `);
}

function pendingPage(name) {
  return shell('Изчаква одобрение', `
    <div style="text-align:center;padding:10px 0;">
      <div style="font-size:52px;margin-bottom:16px;">⏳</div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">Здравейте, ${name}!</h2>
      <p style="font-size:13px;color:#546e7a;line-height:1.7;margin-bottom:24px;">
        Вашата заявка беше изпратена успешно.<br>
        Очаквайте одобрение от администратора.<br>
        Ще получите имейл когато профилът ви бъде активиран.
      </p>
      <a href="/logout" style="display:inline-block;padding:9px 22px;border-radius:6px;background:#f0f2f5;color:#546e7a;text-decoration:none;font-size:13px;font-weight:600;">← Изход</a>
    </div>
  `);
}

function resultPage(title, message, success) {
  return shell(title, `
    <div style="text-align:center;padding:10px 0;">
      <div style="font-size:52px;margin-bottom:16px;">${success ? '✅' : '❌'}</div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:12px;">${title}</h2>
      <p style="font-size:13px;color:#546e7a;line-height:1.7;">${message}</p>
    </div>
  `);
}

module.exports = router;
