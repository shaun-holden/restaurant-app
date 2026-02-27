const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// Validation rules run before the controller.
// express-validator checks the request body and collects any errors.
// The validate middleware then either rejects the request or passes it through.

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// authenticate runs first — verifies the JWT.
// If valid, it attaches req.user and calls next() → getMe runs.
router.get('/me', authenticate, getMe);

module.exports = router;
