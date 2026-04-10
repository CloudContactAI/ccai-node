const http = require('http');

// Test webhook payload
const testPayload = {
  type: 'message.sent',
  campaign: {
    id: 123,
    title: 'Test Campaign',
    message: '',
    senderPhone: '+11234567894',
    createdAt: '2025-01-14 22:18:28.273',
    runAt: ''
  },
  from: '+11234567894',
  to: '+15551234567',
  message: 'Hello John Doe, this is a test message!'
};

const data = JSON.stringify(testPayload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Connection refused. Make sure the webhook server is running:');
    console.error('   npm run webhook:js');
    console.error('   or');
    console.error('   npm run webhook:ts');
  } else {
    console.error('❌ Error:', error.message);
  }
});

req.write(data);
req.end();