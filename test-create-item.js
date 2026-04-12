const http = require('http');

const loginData = JSON.stringify({
  email: 'owner@demo.com',
  password: 'password123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3001,
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
    console.log('Login:', login.success ? 'OK' : 'Failed');
    
    if (login.success) {
      const token = login.data.token;
      console.log('Token:', token.substring(0, 20) + '...');
      
      const itemData = JSON.stringify({
        categoryId: 'cat-appetizers',
        name: 'Test Item',
        description: 'Test description',
        price: 199,
        isAvailable: true
      });
      
      const createReq = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/menu/items',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': itemData.length,
          'Authorization': `Bearer ${token}`
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => body2 += chunk);
        res2.on('end', () => {
          console.log('Create Item Status:', res2.statusCode);
          console.log('Response:', body2);
        });
      });
      
      createReq.on('error', (e) => console.log('Error:', e.message));
      createReq.write(itemData);
      createReq.end();
    }
  });
});

loginReq.on('error', (e) => console.log('Login Error:', e.message));
loginReq.write(loginData);
loginReq.end();