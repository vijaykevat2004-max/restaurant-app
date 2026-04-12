const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 5173,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing proxy at 127.0.0.1:5173...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Response:', data); });
});

req.on('error', (e) => { console.error('Error:', e.message); });

req.write('{"email":"owner@demo.com","password":"password123"}');
req.end();