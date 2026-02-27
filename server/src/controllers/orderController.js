const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/orders — CUSTOMER sees their own orders; STAFF/ADMIN see all
async function getOrders(req, res, next) {
  try {
    const where = req.user.role === 'CUSTOMER' ? { customerId: req.user.id } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, imageUrl: true } },
            choices: { include: { optionChoice: { select: { id: true, label: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/active — STAFF/ADMIN: all non-completed orders (for dashboard)
async function getActiveOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ['DELIVERED', 'CANCELLED'] }
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            menuItem: { select: { name: true } },
            choices: { include: { optionChoice: { select: { label: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'asc' } // oldest first — FIFO queue
    });

    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id — CUSTOMER (own) or STAFF/ADMIN
async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, imageUrl: true } },
            choices: { include: { optionChoice: { select: { label: true, priceModifier: true } } } }
          }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Customers can only see their own orders
    if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
}

// POST /api/orders — called by client AFTER Stripe payment is confirmed
// (for webhook flow, this is called from paymentController instead)
async function createOrder(req, res, next) {
  try {
    const { orderType, deliveryAddress, notes, totalAmount, stripePaymentId, items } = req.body;

    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        orderType,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
        notes,
        totalAmount,
        stripePaymentId,
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
        }
      }
    });

    // Notify staff via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('staff-room').emit('order:new', {
        id: order.id,
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        customer: { name: req.user.name },
        items: order.items.map(i => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          choices: i.choices.map(c => c.optionChoice.label)
        }))
      });
    }

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/status — STAFF/ADMIN
// Advances the order through its lifecycle
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ')}`
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Notify both the customer's room and the staff room
    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: updated.id, status: updated.status, updatedAt: updated.updatedAt };
      io.to(`order:${updated.id}`).emit('order:status_update', payload);
      io.to('staff-room').emit('order:status_update', payload);
    }

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/orders/:id/cancel — CUSTOMER can cancel their PENDING orders
async function cancelOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (order.status !== 'PENDING') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOrders, getActiveOrders, getOrder, createOrder, updateOrderStatus, cancelOrder };
