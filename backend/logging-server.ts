import { createServer, IncomingMessage, ServerResponse } from 'http';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as fs from 'fs';

const log = (msg: string) => {
  console.log(msg);
  fs.appendFileSync('C:\\restaurant saas app\\backend\\server.log', msg + '\n');
};

const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  log(`=== ${req.method} ${req.url} ===`);
  log(`Headers: ${JSON.stringify(req.headers)}`);
  
  if (req.url === '/api/v1/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }
  
  if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: Buffer) => { 
      body += chunk.toString(); 
      log(`Received chunk: ${chunk.toString()}`);
    });
    req.on('end', async () => {
      log(`Complete body: "${body}"`);
      log(`Body length: ${body.length}`);
      
      let parsed;
      try {
        parsed = JSON.parse(body);
        log(`Parsed: ${JSON.stringify(parsed)}`);
      } catch (e: any) {
        log(`Parse error: ${e.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
        return;
      }
      
      const { email, password } = parsed;
      log(`Email: ${email}, Password provided: ${!!password}`);
      
      try {
        const user = await prisma.user.findUnique({ where: { email }, include: { restaurant: true } });
        log(`User found: ${!!user}`);
        
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid' }));
          return;
        }
        
        const valid = await bcrypt.compare(password, user.passwordHash);
        log(`Password valid: ${valid}`);
        
        if (!valid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid' }));
          return;
        }
        
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { token, user: { email: user.email, name: user.name } } }));
      } catch (e: any) {
        log(`Error: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end();
});

server.listen(3001, () => log('Server started on 3001'));