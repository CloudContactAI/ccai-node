const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting webhook server...');

// Start the webhook server
const server = spawn('node', ['webhook-server.js'], {
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(data.toString().trim());
  
  // Once server is running, test the webhook
  if (data.toString().includes('running on port')) {
    setTimeout(testWebhook, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

function testWebhook() {
  console.log('\n📡 Testing webhook...');
  
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
    console.log(`✅ Webhook test successful! Status: ${res.statusCode}`);
    res.on('data', (d) => {
      console.log('Response:', d.toString());
    });
    
    // Clean shutdown
    setTimeout(() => {
      console.log('\n🛑 Stopping server...');
      server.kill();
      process.exit(0);
    }, 1000);
  });

  req.on('error', (error) => {
    console.error('❌ Test failed:', error.message);
    server.kill();
    process.exit(1);
  });

  req.write(data);
  req.end();
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});