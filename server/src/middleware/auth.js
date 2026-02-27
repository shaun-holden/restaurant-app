const jwt = require('jsonwebtoken');

// ── authenticate ────────────────────────────────────────────────────────────
// This middleware runs BEFORE your route handler.
// It reads the Authorization header, verifies the JWT, and attaches the
// decoded user (id + role) to req.user so your controllers can use it.
//
// Flow:
//   Browser sends:  Authorization: Bearer eyJhbGci...
//   middleware reads the token, verifies it, attaches req.user = { id, role }
//   Then calls next() to pass control to the route handler.

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // grab the part after "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── authorize ───────────────────────────────────────────────────────────────
// Used AFTER authenticate. Checks that the logged-in user has one of the
// allowed roles before letting them through.
//
// Usage in a route:
//   router.post('/items', authenticate, authorize('ADMIN'), createItem);
//   router.get('/active', authenticate, authorize('STAFF', 'ADMIN'), getActive);

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
