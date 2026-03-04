const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendApprovalRequest({ name, email, token }) {
  const approveUrl = `${process.env.APP_URL}/admin/approve/${token}`;

  await transporter.sendMail({
    from: `"Е-Дневник" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `📋 Нова заявка за регистрация — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:10px;">
        <div style="background:#1e2a38;padding:18px 24px;border-radius:8px 8px 0 0;margin:-24px -24px 24px;">
          <h2 style="color:#2dbfad;margin:0;font-size:20px;">📚 Е-Дневник</h2>
        </div>
        <h3 style="color:#1e2a38;margin-bottom:6px;">Нова заявка за регистрация</h3>
        <p style="color:#555;margin-bottom:20px;">Потребител поиска достъп до системата:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:8px 12px;background:#fff;border:1px solid #e0e0e0;font-weight:bold;width:100px;">Име</td><td style="padding:8px 12px;background:#fff;border:1px solid #e0e0e0;">${name}</td></tr>
          <tr><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e0e0e0;font-weight:bold;">Имейл</td><td style="padding:8px 12px;background:#f5f5f5;border:1px solid #e0e0e0;">${email}</td></tr>
        </table>
        <a href="${approveUrl}" style="display:inline-block;background:#2dbfad;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:15px;">✓ Одобри потребителя</a>
        <p style="color:#999;font-size:12px;margin-top:20px;">Ако не искате да одобрите тази заявка, просто игнорирайте този имейл.</p>
      </div>
    `,
  });
}

async function sendWelcome({ name, email }) {
  await transporter.sendMail({
    from: `"Е-Дневник" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `✅ Достъпът ви е одобрен — Е-Дневник`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:10px;">
        <div style="background:#1e2a38;padding:18px 24px;border-radius:8px 8px 0 0;margin:-24px -24px 24px;">
          <h2 style="color:#2dbfad;margin:0;font-size:20px;">📚 Е-Дневник</h2>
        </div>
        <h3 style="color:#1e2a38;">Здравейте, ${name}!</h3>
        <p style="color:#555;">Вашата заявка за регистрация беше <strong style="color:#2dbfad;">одобрена</strong>. Вече можете да влезете в системата.</p>
        <a href="${process.env.APP_URL}/login" style="display:inline-block;background:#2dbfad;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:15px;">→ Влезте в системата</a>
      </div>
    `,
  });
}

module.exports = { sendApprovalRequest, sendWelcome };
