const http = require('http');

// Test webhook payload
const testPayload = {
  eventType: 'message.sent',
  eventHash: 'test-event-hash-1234567890',
  data: {
    From: '+11234567894',
    To: '+15551234567',
    Message: 'Hello John Doe, this is a test message!',
    CampaignId: '123',
    CampaignTitle: 'Test Campaign'
  }
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