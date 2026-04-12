import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

async function main() {
  const email = 'owner@demo.com';
  const password = 'password123';
  
  console.log('1. Finding user...');
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      restaurant: true,
      branch: true,
    },
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User found:', user.email);
  
  console.log('2. Comparing password...');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('Password valid:', isValid);
  
  if (!isValid) {
    console.log('Invalid password');
    return;
  }
  
  console.log('3. Creating token...');
  const tokenPayload = {
    userId: user.id,
    restaurantId: user.restaurantId,
    branchId: user.branchId,
    role: user.role,
  };
  
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });
  console.log('Token created');
  
  console.log('4. Returning result...');
  console.log({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantName: user.restaurant.name,
      branchId: user.branchId,
      branchName: user.branch?.name,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());