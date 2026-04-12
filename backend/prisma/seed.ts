import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'apna-restaurant' },
    update: {},
    create: {
      name: 'Apna Restaurant',
      slug: 'apna-restaurant',
      upiId: 'demo@upi',
      upiName: 'Apna Restaurant',
    },
  });

  console.log(`✓ Restaurant: ${restaurant.name}`);

  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      name: 'Main Branch',
      address: '123 Main Street, Downtown',
      restaurantId: restaurant.id,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-downtown' },
    update: {},
    create: {
      id: 'branch-downtown',
      name: 'Downtown Branch',
      address: '456 Oak Avenue, Downtown',
      restaurantId: restaurant.id,
    },
  });

  console.log(`✓ Branches: ${branch1.name}, ${branch2.name}`);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash,
      name: 'Restaurant Owner',
      role: 'OWNER',
      restaurantId: restaurant.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      passwordHash,
      name: 'Branch Manager',
      role: 'MANAGER',
      restaurantId: restaurant.id,
      branchId: branch1.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      email: 'staff@demo.com',
      passwordHash,
      name: 'POS Staff',
      role: 'STAFF',
      restaurantId: restaurant.id,
      branchId: branch1.id,
    },
  });

  console.log(`✓ Users: ${owner.email}, ${manager.email}, ${staff.email}`);

  const category1 = await prisma.menuCategory.upsert({
    where: { id: 'cat-appetizers' },
    update: {},
    create: {
      id: 'cat-appetizers',
      name: 'Appetizers',
      sortOrder: 1,
      restaurantId: restaurant.id,
    },
  });

  const category2 = await prisma.menuCategory.upsert({
    where: { id: 'cat-mains' },
    update: {},
    create: {
      id: 'cat-mains',
      name: 'Main Courses',
      sortOrder: 2,
      restaurantId: restaurant.id,
    },
  });

  const category3 = await prisma.menuCategory.upsert({
    where: { id: 'cat-drinks' },
    update: {},
    create: {
      id: 'cat-drinks',
      name: 'Beverages',
      sortOrder: 3,
      restaurantId: restaurant.id,
    },
  });

  const category4 = await prisma.menuCategory.upsert({
    where: { id: 'cat-desserts' },
    update: {},
    create: {
      id: 'cat-desserts',
      name: 'Desserts',
      sortOrder: 4,
      restaurantId: restaurant.id,
    },
  });

  console.log(`✓ Menu Categories: ${category1.name}, ${category2.name}, ${category3.name}, ${category4.name}`);

  const menuItems = [
    { name: 'Caesar Salad', description: 'Fresh romaine lettuce with caesar dressing', price: 299, categoryId: category1.id, isAvailable: true },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 149, categoryId: category1.id, isAvailable: true },
    { name: 'Soup of the Day', description: 'Ask your server for todays selection', price: 199, categoryId: category1.id, isAvailable: true },
    { name: 'Grilled Salmon', description: 'Atlantic salmon with seasonal vegetables', price: 799, categoryId: category2.id, isAvailable: true },
    { name: 'Ribeye Steak', description: '12oz prime ribeye with mashed potatoes', price: 999, categoryId: category2.id, isAvailable: true },
    { name: 'Chicken Parmesan', description: 'Breaded chicken with marinara and pasta', price: 649, categoryId: category2.id, isAvailable: true },
    { name: 'Vegetable Pasta', description: 'Penne with garden vegetables in garlic oil', price: 499, categoryId: category2.id, isAvailable: true },
    { name: 'Soft Drinks', description: 'Coke, Sprite, Fanta', price: 49, categoryId: category3.id, isAvailable: true },
    { name: 'Fresh Juice', description: 'Orange, Apple, or Cranberry', price: 149, categoryId: category3.id, isAvailable: true },
    { name: 'Coffee', description: 'Regular or Decaf', price: 99, categoryId: category3.id, isAvailable: true },
    { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 249, categoryId: category4.id, isAvailable: true },
    { name: 'Ice Cream Sundae', description: 'Vanilla ice cream with chocolate sauce', price: 199, categoryId: category4.id, isAvailable: true },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `item-${item.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `item-${item.name.toLowerCase().replace(/\s/g, '-')}`,
        ...item,
      },
    });
  }

  console.log(`✓ Menu Items: ${menuItems.length} items created`);

  await prisma.wallet.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      availableBalance: 50000.00,
      pendingBalance: 15000.00,
    },
  });

  console.log(`✓ Wallet initialized with balance`);

  const sampleOrders = [
    { orderNumber: 101, status: 'COMPLETED', paymentStatus: 'COMPLETED', total: 1098, items: [
      { menuItemId: 'item-caesar-salad', name: 'Caesar Salad', quantity: 1, price: 299 },
      { menuItemId: 'item-grilled-salmon', name: 'Grilled Salmon', quantity: 1, price: 799 },
    ]},
    { orderNumber: 102, status: 'PREPARING', paymentStatus: 'COMPLETED', total: 1296, items: [
      { menuItemId: 'item-ribeye-steak', name: 'Ribeye Steak', quantity: 1, price: 999 },
      { menuItemId: 'item-soft-drinks', name: 'Soft Drinks', quantity: 2, price: 49 },
      { menuItemId: 'item-garlic-bread', name: 'Garlic Bread', quantity: 1, price: 149 },
    ]},
    { orderNumber: 103, status: 'NEW', paymentStatus: 'PENDING', total: 798, items: [
      { menuItemId: 'item-chicken-parmesan', name: 'Chicken Parmesan', quantity: 1, price: 649 },
      { menuItemId: 'item-fresh-juice', name: 'Fresh Juice', quantity: 1, price: 149 },
    ]},
  ];

  for (const order of sampleOrders) {
    await prisma.order.upsert({
      where: { id: `order-${order.orderNumber}` },
      update: {},
      create: {
        id: `order-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        restaurantId: restaurant.id,
        branchId: branch1.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: JSON.stringify(order.items),
        subtotal: order.total * 0.92,
        tax: order.total * 0.08,
        total: order.total,
      },
    });
  }

  console.log(`✓ Sample orders created`);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ✅ Database seeded successfully!                        ║
║                                                           ║
║   Test Accounts:                                          ║
║   ├── Owner:   owner@demo.com / password123               ║
║   ├── Manager: manager@demo.com / password123              ║
║   └── Staff:   staff@demo.com / password123                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
