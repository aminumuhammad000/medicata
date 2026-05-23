const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const token = data.token;
      
      const req2 = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/admin/lab-tests?page=1&per_page=15',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res2 => {
        let b = '';
        res2.on('data', d => b += d);
        res2.on('end', () => console.log('RESPONSE:', b));
      });
      req2.end();
    } catch(e) { console.log('ERROR:', body); }
  });
});

req.write(JSON.stringify({email: 'admin@medicata.com', password: 'password123'}));
req.end();
