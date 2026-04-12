import { createServer, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  console.log('=== Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  if (req.url === '/api/v1/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'API running' }));
    return;
  }
  
  if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', async () => {
      console.log('Raw body:', body);
      console.log('Body length:', body.length);
      
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        console.log('Parse error:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }
      
      console.log('Parsed body:', parsed);
      
      const { email, password } = parsed;
      
      if (!email || !password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing email or password', received: parsed }));
        return;
      }
      
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          include: { restaurant: true, branch: true },
        });
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
          return;
        }
        
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid credentials' }));
          return;
        }
        
        const token = jwt.sign(
          { userId: user.id, restaurantId: user.restaurantId, branchId: user.branchId, role: user.role },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, restaurantName: user.restaurant.name }
          }
        }));
      } catch (error: any) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }
});

server.listen(3001, () => console.log('Server on port 3001'));