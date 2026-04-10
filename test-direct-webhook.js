const https = require('https');

// Test the webhook directly via ngrok URL
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
  message: 'Direct webhook test message!'
};

const data = JSON.stringify(testPayload);

// Use your ngrok URL
const options = {
  hostname: '2800a5b4e6fc.ngrok-free.app',
  port: 443,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing webhook directly via ngrok...');

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();