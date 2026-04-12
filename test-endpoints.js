const http = require('http');

const loginData = JSON.stringify({
  email: 'owner@demo.com',
  password: 'password123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3004,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const login = JSON.parse(body);
    if (login.success) {
      const token = login.data.token;
      console.log('Login OK, token:', token.substring(0, 20));
      
      // Try different endpoints
      const endpoints = ['/api/v1/upload', '/upload', '/api/upload'];
      
      for (const endpoint of endpoints) {
        const testReq = http.request({
          hostname: 'localhost',
          port: 3004,
          path: endpoint,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }, (res2) => {
          let body2 = '';
          res2.on('data', (chunk) => body2 += chunk);
          res2.on('end', () => {
            console.log(`${endpoint}: ${res2.statusCode}`);
          });
        });
        testReq.on('error', (e) => console.log(`${endpoint} error:`, e.message));
        testReq.end();
      }
    }
  });
});

loginReq.write(loginData);
loginReq.end();