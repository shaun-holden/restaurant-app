const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/menuController');

const router = Router();

// ── PUBLIC ROUTES (no login required) ─────────────────────────────────────
// Customers need to browse the menu without being logged in.
router.get('/categories', ctrl.getCategories);
router.get('/items', ctrl.getItems);
router.get('/items/:id', ctrl.getItem);

// ── ADMIN-ONLY ROUTES ─────────────────────────────────────────────────────
// authenticate = verify JWT, authorize('ADMIN') = check role.
// These are chained as middleware before the controller function.

// Categories
router.post(
  '/categories',
  authenticate, authorize('ADMIN'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  ctrl.createCategory
);
router.patch('/categories/:id', authenticate, authorize('ADMIN'), ctrl.updateCategory);
router.delete('/categories/:id', authenticate, authorize('ADMIN'), ctrl.deleteCategory);

// Items
router.post(
  '/items',
  authenticate, authorize('ADMIN'),
  [
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  validate,
  ctrl.createItem
);
router.patch('/items/:id', authenticate, authorize('ADMIN'), ctrl.updateItem);
router.delete('/items/:id', authenticate, authorize('ADMIN'), ctrl.deleteItem);

// Option groups
router.post(
  '/items/:id/option-groups',
  authenticate, authorize('ADMIN'),
  [body('name').trim().notEmpty().withMessage('Group name is required')],
  validate,
  ctrl.createOptionGroup
);
router.patch('/option-groups/:groupId', authenticate, authorize('ADMIN'), ctrl.updateOptionGroup);
router.delete('/option-groups/:groupId', authenticate, authorize('ADMIN'), ctrl.deleteOptionGroup);

// Choices
router.post(
  '/option-groups/:groupId/choices',
  authenticate, authorize('ADMIN'),
  [body('label').trim().notEmpty().withMessage('Choice label is required')],
  validate,
  ctrl.createChoice
);
router.patch('/choices/:choiceId', authenticate, authorize('ADMIN'), ctrl.updateChoice);
router.delete('/choices/:choiceId', authenticate, authorize('ADMIN'), ctrl.deleteChoice);

module.exports = router;
