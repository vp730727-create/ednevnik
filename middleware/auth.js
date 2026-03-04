function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

function requireApproved(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  if (req.session.userStatus !== 'approved') {
    return res.redirect('/pending');
  }
  next();
}

module.exports = { requireAuth, requireApproved };
