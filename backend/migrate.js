const { Client } = require('pg');

const client = new Client({
  host: 'db.ghgilnuwkbiqmdhzzznq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'mnbvcxzlkjhgfdsa0987654321)(*&^%$#@!',
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "logo" TEXT,
    "upiId" TEXT,
    "upiName" TEXT,
    "razorpayId" TEXT,
    "paytmMid" TEXT,
    "paytmKey" TEXT,
    "paymentMode" TEXT DEFAULT 'upi',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT DEFAULT 'STAFF',
    "restaurantId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Branch" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "restaurantId" TEXT UNIQUE NOT NULL,
    "availableBalance" DECIMAL DEFAULT 0,
    "pendingBalance" DECIMAL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Ledger" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "walletId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "reference" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "orderNumber" INTEGER NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "customerName" TEXT,
    "tableNumber" TEXT,
    "status" TEXT DEFAULT 'NEW',
    "items" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "tax" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "upiId" TEXT,
    "paymentId" TEXT,
    "paymentStatus" TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Payout" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "restaurantId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "razorpayId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "processedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "MenuCategory" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "MenuItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN DEFAULT true,
    "isVeg" BOOLEAN DEFAULT true,
    "modifiers" TEXT,
    "prepTime" INTEGER DEFAULT 15,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "User_restaurantId_idx" ON "User"("restaurantId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Branch_restaurantId_idx" ON "Branch"("restaurantId");
CREATE INDEX IF NOT EXISTS "Wallet_restaurantId_idx" ON "Wallet"("restaurantId");
CREATE INDEX IF NOT EXISTS "Ledger_walletId_idx" ON "Ledger"("walletId");
CREATE INDEX IF NOT EXISTS "Ledger_restaurantId_idx" ON "Ledger"("restaurantId");
CREATE INDEX IF NOT EXISTS "Order_restaurantId_idx" ON "Order"("restaurantId");
CREATE INDEX IF NOT EXISTS "Order_branchId_idx" ON "Order"("branchId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Payout_restaurantId_idx" ON "Payout"("restaurantId");
CREATE INDEX IF NOT EXISTS "Payout_status_idx" ON "Payout"("status");
CREATE INDEX IF NOT EXISTS "MenuCategory_restaurantId_idx" ON "MenuCategory"("restaurantId");
CREATE INDEX IF NOT EXISTS "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL;
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE;

INSERT INTO "Restaurant" ("id", "name", "slug", "paymentMode") VALUES 
('demo-restaurant-id', 'Apna Restaurant', 'apna-restaurant', 'upi')
ON CONFLICT DO NOTHING;

INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "restaurantId") VALUES 
('demo-user-id', 'owner@apna-restaurant.com', '$2b$10$demohashpassword1234567890', 'Restaurant Owner', 'OWNER', 'demo-restaurant-id')
ON CONFLICT DO NOTHING;

INSERT INTO "Branch" ("id", "name", "restaurantId") VALUES 
('demo-branch-id', 'Main Branch', 'demo-restaurant-id')
ON CONFLICT DO NOTHING;

INSERT INTO "Wallet" ("id", "restaurantId", "availableBalance", "pendingBalance") VALUES 
('demo-wallet-id', 'demo-restaurant-id', 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO "MenuCategory" ("id", "restaurantId", "name", "sortOrder") VALUES 
('demo-category-id', 'demo-restaurant-id', 'Main Course', 0)
ON CONFLICT DO NOTHING;

INSERT INTO "MenuItem" ("id", "categoryId", "name", "description", "price", "isAvailable") VALUES 
('demo-item-id', 'demo-category-id', 'Butter Chicken', 'Creamy tomato-based curry with tender chicken pieces', 350.00, true)
ON CONFLICT DO NOTHING;
`;

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to database!');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
