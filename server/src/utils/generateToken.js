const jwt = require('jsonwebtoken');

// Creates a signed JWT containing the user's id and role.
// The token expires after JWT_EXPIRES_IN (e.g. "7d").
// Anyone who has this token can prove they are this user — guard it like a password.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
