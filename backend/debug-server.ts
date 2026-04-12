import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

app.use(cors({ origin: '*' }));

// Raw body logging middleware
app.use((req, res, next) => {
  console.log('=== REQUEST ===');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers));
  
  let rawData = '';
  req.on('data', chunk => { rawData += chunk; });
  req.on('end', () => {
    console.log('Raw body:', rawData);
    try {
      req.body = rawData ? JSON.parse(rawData) : {};
      console.log('Parsed body:', req.body);
    } catch (e) {
      console.error('JSON parse error:', e.message);
      req.body = {};
    }
    next();
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { restaurant: true, branch: true },
    });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, restaurantId: user.restaurantId, branchId: user.branchId, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    res.json({
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
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'API running' });
});

const server = app.listen(3001, () => {
  console.log('Server on http://localhost:3001');
});