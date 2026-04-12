import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

async function testLogin() {
  try {
    console.log('Step 1: Parse input...');
    const email = 'owner@demo.com';
    const password = 'password123';
    
    console.log('Step 2: Find user...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true, branch: true },
    });
    console.log('User found:', user?.email);
    
    if (!user) throw new Error('User not found');
    
    console.log('Step 3: Compare password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isValid);
    
    if (!isValid) throw new Error('Invalid password');
    
    console.log('Step 4: Create token...');
    const token = jwt.sign(
      { userId: user.id, restaurantId: user.restaurantId, branchId: user.branchId, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    console.log('Step 5: Return result...');
    console.log('SUCCESS:', { token, user: { name: user.name, role: user.role, restaurant: user.restaurant.name } });
  } catch (e) {
    console.error('FAILED:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();