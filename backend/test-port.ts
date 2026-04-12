import { createServer } from 'http';

const server = createServer((req, res) => {
  if (req.url === '/test' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('RECEIVED:', body);
      console.log('LENGTH:', body.length);
      res.end('Body was: ' + body);
    });
  } else {
    res.end('OK');
  }
});

server.listen(3003, () => console.log('Test server on 3003'));