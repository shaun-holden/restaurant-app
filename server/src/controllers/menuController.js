const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── CATEGORIES ─────────────────────────────────────────────────────────────

// GET /api/menu/categories
// Public. Returns all categories sorted by sortOrder.
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

// POST /api/menu/categories — ADMIN only
async function createCategory(req, res, next) {
  try {
    const { name, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: { name, sortOrder: sortOrder || 0 }
    });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/menu/categories/:id — ADMIN only
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, sortOrder } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { ...(name && { name }), ...(sortOrder !== undefined && { sortOrder }) }
    });
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/menu/categories/:id — ADMIN only
async function deleteCategory(req, res, next) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

// ── MENU ITEMS ─────────────────────────────────────────────────────────────

// GET /api/menu/items
// Public. Supports optional query params: ?categoryId=xxx&search=pizza&available=true
// This is how the customer-facing menu browse works.
async function getItems(req, res, next) {
  try {
    const { categoryId, search, available } = req.query;

    // Build the WHERE clause dynamically based on what query params were sent
    const where = {};
    if (categoryId) where.categoryId = categoryId;
    if (available !== undefined) where.isAvailable = available === 'true';
    if (search) {
      // Prisma's "contains" with "insensitive" mode = case-insensitive LIKE search
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { optionGroups: true } }
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }]
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// GET /api/menu/items/:id
// Public. Returns a single item WITH its option groups and choices.
// The customer sees this on the item detail/customization page.
async function getItem(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true } },
        // Nested include: get groups, and inside each group get choices
        optionGroups: {
          orderBy: { createdAt: 'asc' },
          include: {
            choices: { orderBy: { sortOrder: 'asc' } }
          }
        }
      }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// POST /api/menu/items — ADMIN only
async function createItem(req, res, next) {
  try {
    const { categoryId, name, description, basePrice, imageUrl, sortOrder } = req.body;
    const item = await prisma.menuItem.create({
      data: { categoryId, name, description, basePrice, imageUrl, sortOrder: sortOrder || 0 },
      include: { category: true }
    });
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/menu/items/:id — ADMIN only
async function updateItem(req, res, next) {
  try {
    const allowed = ['name', 'description', 'basePrice', 'imageUrl', 'isAvailable', 'sortOrder', 'categoryId'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data,
      include: { category: true }
    });
    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/menu/items/:id — ADMIN only
async function deleteItem(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

// ── OPTION GROUPS ──────────────────────────────────────────────────────────

// POST /api/menu/items/:id/option-groups — ADMIN only
// Adds an option group to a menu item. e.g. "Size" to "Burger"
async function createOptionGroup(req, res, next) {
  try {
    const { name, required, multiSelect } = req.body;
    const group = await prisma.menuItemOptionGroup.create({
      data: {
        menuItemId: req.params.id,
        name,
        required: required || false,
        multiSelect: multiSelect || false
      },
      include: { choices: true }
    });
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/menu/option-groups/:groupId — ADMIN only
async function updateOptionGroup(req, res, next) {
  try {
    const { name, required, multiSelect } = req.body;
    const group = await prisma.menuItemOptionGroup.update({
      where: { id: req.params.groupId },
      data: {
        ...(name && { name }),
        ...(required !== undefined && { required }),
        ...(multiSelect !== undefined && { multiSelect })
      }
    });
    res.json({ group });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/menu/option-groups/:groupId — ADMIN only
// Cascade in schema means all choices under this group are also deleted
async function deleteOptionGroup(req, res, next) {
  try {
    await prisma.menuItemOptionGroup.delete({ where: { id: req.params.groupId } });
    res.json({ message: 'Option group deleted' });
  } catch (err) {
    next(err);
  }
}

// ── OPTION CHOICES ─────────────────────────────────────────────────────────

// POST /api/menu/option-groups/:groupId/choices — ADMIN only
async function createChoice(req, res, next) {
  try {
    const { label, priceModifier, sortOrder } = req.body;
    const choice = await prisma.optionChoice.create({
      data: {
        optionGroupId: req.params.groupId,
        label,
        priceModifier: priceModifier || 0,
        sortOrder: sortOrder || 0
      }
    });
    res.status(201).json({ choice });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/menu/choices/:choiceId — ADMIN only
async function updateChoice(req, res, next) {
  try {
    const { label, priceModifier, sortOrder } = req.body;
    const choice = await prisma.optionChoice.update({
      where: { id: req.params.choiceId },
      data: {
        ...(label && { label }),
        ...(priceModifier !== undefined && { priceModifier }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    });
    res.json({ choice });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/menu/choices/:choiceId — ADMIN only
async function deleteChoice(req, res, next) {
  try {
    await prisma.optionChoice.delete({ where: { id: req.params.choiceId } });
    res.json({ message: 'Choice deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory,
  getItems, getItem, createItem, updateItem, deleteItem,
  createOptionGroup, updateOptionGroup, deleteOptionGroup,
  createChoice, updateChoice, deleteChoice
};
