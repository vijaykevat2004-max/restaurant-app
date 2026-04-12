import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

app.use(cors());

// Debug: print raw body before any parsing
app.use((req, res, next) => {
  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { rawBody += chunk; });
  req.on('end', () => {
    console.log('=== RAW BODY ===');
    console.log('Length:', rawBody.length);
    console.log('Content:', JSON.stringify(rawBody));
    console.log('================');
    
    if (rawBody) {
      try {
        req.body = JSON.parse(rawBody);
      } catch (e) {
        console.log('Parse error:', e.message);
        req.body = {};
      }
    } else {
      req.body = {};
    }
    next();
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  console.log('=== PARSED BODY ===');
  console.log(req.body);
  console.log('===================');
  
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password', received: req.body });
  }
  
  try {
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
      data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, restaurantName: user.restaurant.name } },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/health', (req, res) => res.json({ success: true }));

app.listen(3001, () => console.log('Server on 3001'));