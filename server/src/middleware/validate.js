const { validationResult } = require('express-validator');

// Runs after express-validator checks and returns all errors as JSON
// if any validation failed. Otherwise calls next() to continue.
//
// Usage:
//   router.post('/register',
//     body('email').isEmail(),
//     body('password').isLength({ min: 6 }),
//     validate,               ← this middleware collects errors
//     authController.register ← only reached if validation passed
//   );

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
