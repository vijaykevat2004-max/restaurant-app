-- ===========================================
-- APNA RESTAURANT - Complete Seed Data
-- Run this AFTER migration.sql in Supabase SQL Editor
-- Login: owner@apna-restaurant.com / password123
-- ===========================================

-- Demo Restaurant
INSERT INTO "Restaurant" ("id", "name", "slug", "upiId", "upiName", "paymentMode")
VALUES ('demo-restaurant-id', 'Apna Restaurant', 'apna-restaurant', 'demo@upi', 'Apna Restaurant', 'upi')
ON CONFLICT ("id") DO NOTHING;

-- Demo User (password: password123)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "restaurantId")
VALUES ('demo-user-id', 'owner@apna-restaurant.com', '$2b$10$t9YEngkTXjPyUf2m9FMuBuLRFFEbGSW24PzjXZe1PyXXb7acYATRu', 'Restaurant Owner', 'OWNER', 'demo-restaurant-id')
ON CONFLICT ("id") DO NOTHING;

-- Branches
INSERT INTO "Branch" ("id", "name", "address", "restaurantId")
VALUES ('branch-main', 'Main Branch', '123 Main Street, Downtown', 'demo-restaurant-id')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Branch" ("id", "name", "address", "restaurantId")
VALUES ('branch-downtown', 'Downtown Branch', '456 Oak Avenue, Downtown', 'demo-restaurant-id')
ON CONFLICT ("id") DO NOTHING;

-- Wallet
INSERT INTO "Wallet" ("id", "restaurantId", "availableBalance", "pendingBalance")
VALUES ('demo-wallet-id', 'demo-restaurant-id', 50000, 15000)
ON CONFLICT ("id") DO NOTHING;

-- Menu Categories
INSERT INTO "MenuCategory" ("id", "restaurantId", "name", "sortOrder")
VALUES ('cat-appetizers', 'demo-restaurant-id', 'Appetizers', 0)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuCategory" ("id", "restaurantId", "name", "sortOrder")
VALUES ('cat-mains', 'demo-restaurant-id', 'Main Courses', 1)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuCategory" ("id", "restaurantId", "name", "sortOrder")
VALUES ('cat-drinks', 'demo-restaurant-id', 'Beverages', 2)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuCategory" ("id", "restaurantId", "name", "sortOrder")
VALUES ('cat-desserts', 'demo-restaurant-id', 'Desserts', 3)
ON CONFLICT ("id") DO NOTHING;

-- Menu Items
INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-caesar-salad', 'cat-appetizers', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 299.00, true, true, 10)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-garlic-bread', 'cat-appetizers', 'Garlic Bread', 'Toasted bread with garlic butter', 149.00, true, true, 8)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-soup-of-the-day', 'cat-appetizers', 'Soup of the Day', 'Ask your server for todays selection', 199.00, true, true, 12)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-grilled-salmon', 'cat-mains', 'Grilled Salmon', 'Atlantic salmon with seasonal vegetables', 799.00, true, false, 20)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-ribeye-steak', 'cat-mains', 'Ribeye Steak', '12oz prime ribeye with mashed potatoes', 999.00, true, false, 25)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-chicken-parmesan', 'cat-mains', 'Chicken Parmesan', 'Breaded chicken with marinara and pasta', 649.00, true, false, 22)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-vegetable-pasta', 'cat-mains', 'Vegetable Pasta', 'Penne with garden vegetables in garlic oil', 499.00, true, true, 18)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-soft-drinks', 'cat-drinks', 'Soft Drinks', 'Coke, Sprite, Fanta', 49.00, true, true, 3)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-fresh-juice', 'cat-drinks', 'Fresh Juice', 'Orange, Apple, or Cranberry', 149.00, true, true, 5)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-coffee', 'cat-drinks', 'Coffee', 'Regular or Decaf', 99.00, true, true, 5)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-chocolate-cake', 'cat-desserts', 'Chocolate Cake', 'Rich chocolate layer cake', 249.00, true, true, 10)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable", "isVeg", "prepTime")
VALUES ('item-ice-cream-sundae', 'cat-desserts', 'Ice Cream Sundae', 'Vanilla ice cream with chocolate sauce', 199.00, true, true, 8)
ON CONFLICT ("id") DO NOTHING;

-- Sample Orders
INSERT INTO "Order" ("id", "orderNumber", "restaurantId", "branchId", "customerName", "tableNumber", "status", "items", "subtotal", "tax", "total", "paymentStatus")
VALUES ('order-101', 101, 'demo-restaurant-id', 'branch-main', 'Rahul Sharma', 'T5', 'COMPLETED', '[{"menuItemId":"item-caesar-salad","name":"Caesar Salad","quantity":1,"price":299},{"menuItemId":"item-grilled-salmon","name":"Grilled Salmon","quantity":1,"price":799}]', 1010.00, 88.00, 1098.00, 'COMPLETED')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Order" ("id", "orderNumber", "restaurantId", "branchId", "customerName", "tableNumber", "status", "items", "subtotal", "tax", "total", "paymentStatus")
VALUES ('order-102', 102, 'demo-restaurant-id', 'branch-main', 'Priya Patel', 'T3', 'PREPARING', '[{"menuItemId":"item-ribeye-steak","name":"Ribeye Steak","quantity":1,"price":999},{"menuItemId":"item-soft-drinks","name":"Soft Drinks","quantity":2,"price":49},{"menuItemId":"item-garlic-bread","name":"Garlic Bread","quantity":1,"price":149}]', 1192.00, 104.00, 1296.00, 'COMPLETED')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Order" ("id", "orderNumber", "restaurantId", "branchId", "customerName", "tableNumber", "status", "items", "subtotal", "tax", "total", "paymentStatus")
VALUES ('order-103', 103, 'demo-restaurant-id', 'branch-main', 'Amit Singh', 'T7', 'NEW', '[{"menuItemId":"item-chicken-parmesan","name":"Chicken Parmesan","quantity":1,"price":649},{"menuItemId":"item-fresh-juice","name":"Fresh Juice","quantity":1,"price":149}]', 734.00, 64.00, 798.00, 'PENDING')
ON CONFLICT ("id") DO NOTHING;
