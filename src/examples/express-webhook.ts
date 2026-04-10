import express from 'express';
import { WebhookEvent, WebhookEventType } from '../webhook/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CCAI Webhook handler
app.post('/webhook', (req: express.Request, res: express.Response) => {
  const event = req.body as WebhookEvent;
  
  console.log('CCAI Webhook Event:', event);
  
  switch (event.type) {
    case WebhookEventType.MESSAGE_SENT:
      console.log(`📤 Message sent: ${event.from} → ${event.to}`);
      console.log(`   Campaign: ${event.campaign.title}`);
      console.log(`   Message: ${event.message}`);
      break;
      
    case WebhookEventType.MESSAGE_RECEIVED:
      console.log(`📥 Message received: ${event.from} → ${event.to}`);
      console.log(`   Campaign: ${event.campaign.title}`);
      console.log(`   Message: ${event.message}`);
      break;
      
    default:
      console.warn('Unknown event type:', (event as any).type);
  }
  
  res.status(200).json({ received: true });
});

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 CCAI Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
});