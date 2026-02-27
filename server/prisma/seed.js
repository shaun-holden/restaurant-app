const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── STAFF USER ──────────────────────────────────────────────────────────
  // Create an ADMIN account you can use to log in and manage the menu.
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      name: 'Restaurant Admin',
      email: 'admin@restaurant.com',
      passwordHash: adminHash,
      role: 'ADMIN'
    }
  });

  const staffHash = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@restaurant.com' },
    update: {},
    create: {
      name: 'Kitchen Staff',
      email: 'staff@restaurant.com',
      passwordHash: staffHash,
      role: 'STAFF'
    }
  });

  console.log(`Created admin: ${admin.email}`);

  // ── CATEGORIES ──────────────────────────────────────────────────────────
  // upsert = create if not exists, update if it does (safe to run multiple times)
  const [burgers, sides, drinks, desserts] = await Promise.all([
    prisma.category.upsert({ where: { name: 'Burgers' }, update: {}, create: { name: 'Burgers', sortOrder: 1 } }),
    prisma.category.upsert({ where: { name: 'Sides' }, update: {}, create: { name: 'Sides', sortOrder: 2 } }),
    prisma.category.upsert({ where: { name: 'Drinks' }, update: {}, create: { name: 'Drinks', sortOrder: 3 } }),
    prisma.category.upsert({ where: { name: 'Desserts' }, update: {}, create: { name: 'Desserts', sortOrder: 4 } }),
  ]);

  console.log('Categories created');

  // ── MENU ITEMS ──────────────────────────────────────────────────────────
  // Classic Burger with Size + Toppings option groups
  const classicBurger = await prisma.menuItem.create({
    data: {
      categoryId: burgers.id,
      name: 'Classic Burger',
      description: 'Beef patty, lettuce, tomato, onion, pickles, and our signature sauce on a brioche bun.',
      basePrice: 12.99,
      sortOrder: 1,
      optionGroups: {
        create: [
          {
            name: 'Size',
            required: true,
            multiSelect: false, // radio buttons — pick exactly one
            choices: {
              create: [
                { label: 'Regular', priceModifier: 0, sortOrder: 1 },
                { label: 'Double Patty', priceModifier: 3.00, sortOrder: 2 },
              ]
            }
          },
          {
            name: 'Add-ons',
            required: false,
            multiSelect: true, // checkboxes — pick any
            choices: {
              create: [
                { label: 'Extra Cheese', priceModifier: 1.00, sortOrder: 1 },
                { label: 'Bacon', priceModifier: 1.50, sortOrder: 2 },
                { label: 'Avocado', priceModifier: 2.00, sortOrder: 3 },
                { label: 'Jalapeños', priceModifier: 0.50, sortOrder: 4 },
              ]
            }
          }
        ]
      }
    }
  });

  // BBQ Chicken Burger
  await prisma.menuItem.create({
    data: {
      categoryId: burgers.id,
      name: 'BBQ Chicken Burger',
      description: 'Crispy fried chicken, BBQ sauce, coleslaw, and pickles.',
      basePrice: 13.99,
      sortOrder: 2,
      optionGroups: {
        create: [
          {
            name: 'Sauce',
            required: true,
            multiSelect: false,
            choices: {
              create: [
                { label: 'BBQ', priceModifier: 0, sortOrder: 1 },
                { label: 'Honey Mustard', priceModifier: 0, sortOrder: 2 },
                { label: 'Ranch', priceModifier: 0, sortOrder: 3 },
              ]
            }
          }
        ]
      }
    }
  });

  // Veggie Burger (no option groups — simple item)
  await prisma.menuItem.create({
    data: {
      categoryId: burgers.id,
      name: 'Veggie Burger',
      description: 'House-made black bean patty, guacamole, roasted peppers, and lettuce.',
      basePrice: 11.99,
      sortOrder: 3,
    }
  });

  // Sides
  const [fries] = await Promise.all([
    prisma.menuItem.create({
      data: {
        categoryId: sides.id,
        name: 'Fries',
        description: 'Golden crispy fries, lightly salted.',
        basePrice: 3.99,
        sortOrder: 1,
        optionGroups: {
          create: [{
            name: 'Size',
            required: true,
            multiSelect: false,
            choices: {
              create: [
                { label: 'Regular', priceModifier: 0, sortOrder: 1 },
                { label: 'Large', priceModifier: 1.00, sortOrder: 2 },
              ]
            }
          }]
        }
      }
    }),
    prisma.menuItem.create({
      data: {
        categoryId: sides.id,
        name: 'Onion Rings',
        description: 'Beer-battered onion rings with dipping sauce.',
        basePrice: 4.99,
        sortOrder: 2,
      }
    }),
    prisma.menuItem.create({
      data: {
        categoryId: sides.id,
        name: 'Coleslaw',
        description: 'Creamy house-made coleslaw.',
        basePrice: 2.99,
        sortOrder: 3,
      }
    }),
  ]);

  // Drinks
  await Promise.all([
    prisma.menuItem.create({
      data: {
        categoryId: drinks.id,
        name: 'Soft Drink',
        description: 'Cola, Lemon Lime, or Orange — served with ice.',
        basePrice: 2.99,
        sortOrder: 1,
        optionGroups: {
          create: [{
            name: 'Flavour',
            required: true,
            multiSelect: false,
            choices: {
              create: [
                { label: 'Cola', priceModifier: 0, sortOrder: 1 },
                { label: 'Lemon Lime', priceModifier: 0, sortOrder: 2 },
                { label: 'Orange', priceModifier: 0, sortOrder: 3 },
              ]
            }
          }]
        }
      }
    }),
    prisma.menuItem.create({
      data: {
        categoryId: drinks.id,
        name: 'Milkshake',
        description: 'Thick and creamy — made fresh to order.',
        basePrice: 6.99,
        sortOrder: 2,
        optionGroups: {
          create: [{
            name: 'Flavour',
            required: true,
            multiSelect: false,
            choices: {
              create: [
                { label: 'Vanilla', priceModifier: 0, sortOrder: 1 },
                { label: 'Chocolate', priceModifier: 0, sortOrder: 2 },
                { label: 'Strawberry', priceModifier: 0, sortOrder: 3 },
                { label: 'Caramel', priceModifier: 0, sortOrder: 4 },
              ]
            }
          }]
        }
      }
    }),
    prisma.menuItem.create({
      data: {
        categoryId: drinks.id,
        name: 'Water',
        description: 'Still or sparkling.',
        basePrice: 1.99,
        sortOrder: 3,
      }
    }),
  ]);

  // Desserts
  await Promise.all([
    prisma.menuItem.create({
      data: {
        categoryId: desserts.id,
        name: 'Brownie Sundae',
        description: 'Warm chocolate brownie topped with vanilla ice cream and chocolate sauce.',
        basePrice: 7.99,
        sortOrder: 1,
      }
    }),
    prisma.menuItem.create({
      data: {
        categoryId: desserts.id,
        name: 'Apple Pie',
        description: 'Classic apple pie with cinnamon, served warm.',
        basePrice: 5.99,
        sortOrder: 2,
      }
    }),
  ]);

  console.log('Menu items created');
  console.log('\nSeed complete! Accounts created:');
  console.log('  Admin:  admin@restaurant.com / admin123');
  console.log('  Staff:  staff@restaurant.com / staff123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
