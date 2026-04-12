const http = require('http');

const loginData = JSON.stringify({
  email: 'owner@demo.com',
  password: 'password123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 3002,
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
      
      const delReq = http.request({
        hostname: 'localhost',
        port: 3002,
        path: '/api/v1/menu/items/item-caesar-salad',
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res2) => {
        let body2 = '';
        res2.on('data', (chunk) => body2 += chunk);
        res2.on('end', () => {
          console.log('Delete Status:', res2.statusCode);
          console.log('Response:', body2);
        });
      });
      
      delReq.on('error', (e) => console.log('Error:', e.message));
      delReq.end();
    }
  });
});

loginReq.on('error', (e) => console.log('Login Error:', e.message));
loginReq.write(loginData);
loginReq.end();