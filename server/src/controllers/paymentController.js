const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Stripe is initialized with your secret key.
// The secret key lives ONLY in the server .env — never in the browser.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent and returns the clientSecret to the browser.
// The browser uses this secret to confirm the payment on Stripe's side.
//
// Note: We pass the cart items in metadata so the webhook can recreate the order.
// This is important because: the client might disconnect before our frontend
// can POST /api/orders — but the webhook is reliable.
async function createPaymentIntent(req, res, next) {
  try {
    const { amount, orderType, deliveryAddress, notes, items } = req.body;
    // amount must be in cents for Stripe (e.g., $12.99 = 1299)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      // Store order data in metadata so the webhook can access it later
      metadata: {
        customerId: req.user.id,
        orderType,
        deliveryAddress: deliveryAddress || '',
        notes: notes || '',
        // Stringify the cart because metadata values must be strings
        items: JSON.stringify(items)
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/webhook
// Stripe calls this after a successful payment.
// Uses express.raw() body (registered in app.js before express.json())
// so we can verify the Stripe signature — proving it really came from Stripe.
async function handleWebhook(req, res, next) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // This throws if the signature is invalid — protecting against fake webhook calls
    event = stripe.webhooks.constructEvent(
      req.body, // raw bytes, not parsed JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const meta = pi.metadata;

    try {
      const items = JSON.parse(meta.items || '[]');

      const order = await prisma.order.create({
        data: {
          customerId: meta.customerId,
          orderType: meta.orderType,
          deliveryAddress: meta.orderType === 'DELIVERY' ? meta.deliveryAddress : null,
          notes: meta.notes || null,
          totalAmount: pi.amount / 100, // convert cents back to dollars
          stripePaymentId: pi.id,
          items: {
            create: items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes || '',
              choices: {
                create: (item.selectedChoiceIds || []).map(choiceId => ({
                  optionChoiceId: choiceId
                }))
              }
            }))
          }
        },
        include: {
          items: {
            include: {
              menuItem: { select: { name: true } },
              choices: { include: { optionChoice: { select: { label: true } } } }
            }
          },
          customer: { select: { name: true } }
        }
      });

      // Emit real-time notification to staff
      // req.app.get('io') gets the Socket.IO instance we stored in server.js
      const io = req.app.get('io');
      if (io) {
        io.to('staff-room').emit('order:new', {
          id: order.id,
          orderType: order.orderType,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          customer: { name: order.customer.name },
          items: order.items.map(i => ({
            name: i.menuItem.name,
            quantity: i.quantity,
            choices: i.choices.map(c => c.optionChoice.label)
          }))
        });
      }

      console.log(`Order created: ${order.id}`);
    } catch (err) {
      console.error('Failed to create order from webhook:', err);
    }
  }

  // Always return 200 quickly — Stripe retries if it doesn't get a 200
  res.json({ received: true });
}

module.exports = { createPaymentIntent, handleWebhook };
