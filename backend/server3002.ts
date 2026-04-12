import { createServer, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  console.log(`=== ${req.method} ${req.url} ===`);
  
  if (req.url === '/api/v1/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  
  if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
    let body: string[] = [];
    req.on('data', (chunk: Buffer) => { 
      body.push(chunk.toString()); 
    });
    req.on('end', async () => {
      const fullBody = body.join('');
      console.log('Body:', fullBody);
      
      let parsed;
      try {
        parsed = JSON.parse(fullBody);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }
      
      const { email, password } = parsed;
      console.log('Parsed email:', email);
      console.log('Parsed password:', password ? 'yes' : 'no');
      
      try {
        const user = await prisma.user.findUnique({ where: { email }, include: { restaurant: true } });
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid' }));
          return;
        }
        
        const valid = await bcrypt.compare(password, user.passwordHash);
        
        if (!valid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid' }));
          return;
        }
        
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { token, user: { email: user.email, name: user.name } } }));
      } catch (e: any) {
        console.error('Error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end();
});

// Use port 3002 to avoid conflicts
server.listen(3002, () => console.log('Server on 3002'));