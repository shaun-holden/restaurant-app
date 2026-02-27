const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { createPaymentIntent, handleWebhook } = require('../controllers/paymentController');

const router = Router();

// Create payment intent — authenticated customer only
router.post('/create-intent', authenticate, createPaymentIntent);

// Stripe webhook — NO authenticate middleware here.
// Stripe calls this from their servers with their own signature.
// We verify it using stripe.webhooks.constructEvent() inside the controller.
// express.raw() is applied in app.js specifically for this route.
router.post('/webhook', handleWebhook);

module.exports = router;
