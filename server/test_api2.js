const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
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
        path: '/api/admin/lab-tests?page=1&per_page=15',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res2 => {
        let b = '';
        res2.on('data', d => b += d);
        res2.on('end', () => console.log('LAB TESTS RESPONSE:', b.substring(0, 500)));
      });
      req2.end();
      
      const req3 = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/admin/prescriptions?page=1&per_page=15',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res3 => {
        let b = '';
        res3.on('data', d => b += d);
        res3.on('end', () => console.log('PRESCRIPTIONS RESPONSE:', b.substring(0, 500)));
      });
      req3.end();
    } catch(e) { console.log('ERROR:', body); }
  });
});

req.write(JSON.stringify({email: 'admin@medicata.com', password: 'password123'}));
req.end();
