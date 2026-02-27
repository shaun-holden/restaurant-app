const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const generateToken = require('../utils/generateToken');

const prisma = new PrismaClient();

// POST /api/auth/register
// Creates a new CUSTOMER account.
// We hash the password before storing it — plain text passwords are never saved.
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // bcrypt.hash(password, 10) — the 10 is the "salt rounds".
    // Higher = more secure but slower. 10 is the industry standard.
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone },
      select: { id: true, name: true, email: true, role: true } // never return passwordHash
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err); // passes to errorHandler middleware
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always use a generic error message here — never tell the attacker
    // whether the email exists or just the password was wrong.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Returns the current user's profile. Requires the authenticate middleware.
async function getMe(req, res, next) {
  try {
    // req.user was set by the authenticate middleware from the JWT
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
