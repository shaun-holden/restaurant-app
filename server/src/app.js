const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// ── STRIPE WEBHOOK (must come BEFORE express.json()) ──────────────────────
// The Stripe webhook endpoint needs the raw request body (bytes, not parsed JSON)
// so that stripe.webhooks.constructEvent() can verify the signature.
// If express.json() ran first, it would parse the body and the signature check fails.
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);

// ── BODY PARSERS ──────────────────────────────────────────────────────────
app.use(express.json());

// ── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);

// ── ERROR HANDLER ─────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
