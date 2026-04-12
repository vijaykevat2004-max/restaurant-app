const response = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'owner@demo.com', password: 'password123' }),
});
const data = await response.json();
console.log('Response:', JSON.stringify(data, null, 2));