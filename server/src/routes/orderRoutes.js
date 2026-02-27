const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getOrders, getActiveOrders, getOrder, createOrder, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

const router = Router();

// All order routes require authentication
router.use(authenticate);

// IMPORTANT: The /active route must be registered BEFORE /:id
// because Express reads routes top to bottom. If /:id came first,
// Express would match /active as an ID parameter, not this specific route.
router.get('/active', authorize('STAFF', 'ADMIN'), getActiveOrders);

router.get('/', getOrders);
router.post('/', authorize('CUSTOMER'), createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', authorize('STAFF', 'ADMIN'), updateOrderStatus);
router.patch('/:id/cancel', authorize('CUSTOMER'), cancelOrder);

module.exports = router;
