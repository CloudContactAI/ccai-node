const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// CCAI Webhook endpoint
app.post('/webhook', (req, res) => {
  const payload = req.body;
  
  console.log('Webhook received:', payload);
  
  // Handle different event types
  if (payload.type === 'message.sent') {
    console.log(`Message sent from ${payload.from} to ${payload.to}: ${payload.message}`);
  } else if (payload.type === 'message.received') {
    console.log(`Message received from ${payload.from} to ${payload.to}: ${payload.message}`);
  }
  
  // Always respond with 200
  res.status(200).json({ received: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CCAI Webhook server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});