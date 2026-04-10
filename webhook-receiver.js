// Simple webhook receiver for testing
import express from 'express';

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('Webhook received:');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const payload = req.body;
  
  if (payload.type === 'message.sent') {
    console.log(`✅ Message sent from ${payload.from} to ${payload.to}`);
    console.log(`📧 Campaign: ${payload.campaign.title}`);
    console.log(`💬 Message: ${payload.message}`);
  } else if (payload.type === 'message.received') {
    console.log(`📨 Message received from ${payload.from} to ${payload.to}`);
    console.log(`📧 Campaign: ${payload.campaign.title}`);
    console.log(`💬 Message: ${payload.message}`);
  }
  
  res.status(200).json({ received: true });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook receiver running on http://localhost:${PORT}/webhook`);
  console.log('📝 Configure this URL in CloudContactAI webhook settings');
});