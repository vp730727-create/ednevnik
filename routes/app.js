const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireApproved } = require('../middleware/auth');

const router = express.Router();

router.get('/app', requireApproved, (req, res) => {
  const name = req.session.userName || 'Учител';
  const initials = name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);

  let html = fs.readFileSync(path.join(__dirname, '../views/app.html'), 'utf8');
  html = html.replace(/__USERNAME__/g, name);
  html = html.replace(/__INITIALS__/g, initials);

  res.send(html);
});

module.exports = router;
