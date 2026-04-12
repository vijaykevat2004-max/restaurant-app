import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

app.use(cors({ origin: '*' }));
app.use(express.json());

console.log('Setting up routes...');

app.post('/api/v1/auth/login', async (req, res) => {
  console.log('=== POST /api/v1/auth/login ===');
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    const { email, password } = req.body;
    console.log('Email:', email, 'Password length:', password?.length);
    
    console.log('Finding user...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true, branch: true },
    });
    console.log('User found:', user?.email);
    
    if (!user) {
      console.log('User not found, returning 401');
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    console.log('Comparing password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('Invalid password, returning 401');
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    console.log('Creating token...');
    const token = jwt.sign(
      { 
        userId: user.id, 
        restaurantId: user.restaurantId, 
        branchId: user.branchId, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    console.log('Token created');
    
    console.log('Returning success...');
    return res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('=== ERROR IN LOGIN ===');
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    return res.status(500).json({ 
      success: false, 
      error: error?.message || 'Internal server error',
      stack: error?.stack 
    });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

console.log('Starting server on port 3001...');
const server = app.listen(3001, () => {
  console.log('Server started on http://localhost:3001');
});

process.on('SIGTERM', () => {
  server.close(() => prisma.$disconnect());
});