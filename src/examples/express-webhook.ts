import express from 'express';
import { CCAI } from '../ccai';
import { WebhookEvent, WebhookEventType } from '../webhook/types';
import { Webhook } from '../webhook/webhook';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize CCAI for webhook signature verification
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

const webhook = new Webhook(ccai);

// Middleware to parse JSON bodies as raw strings for signature verification
app.use(express.raw({ type: 'application/json' }));
app.use(
  (
    req: express.Request & { rawBody?: Buffer },
    _res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      next();
    } else if (req.body) {
      req.rawBody = req.body as Buffer;
      req.body = JSON.parse((req.body as Buffer).toString());
      next();
    } else {
      next();
    }
  }
);

// CCAI Webhook handler with signature verification
app.post('/webhook', (req: express.Request, res: express.Response) => {
  const event = req.body as WebhookEvent;
  const signature = req.headers['x-ccai-signature'] as string;
  const clientId = process.env.CCAI_CLIENT_ID || '';
  const webhookSecret = process.env.CCAI_WEBHOOK_SECRET || '';

  // Verify the webhook signature
  // Signature is computed as: HMAC-SHA256(webhookSecret, clientId:eventHash) in Base64
  const isValid = webhook.verifySignature(signature, clientId, event.eventHash, webhookSecret);

  if (!isValid) {
    console.error('❌ Invalid webhook signature - rejecting');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  console.log('✅ Webhook signature verified');
  console.log('CCAI Webhook Event:', event);

  switch (event.eventType) {
    case WebhookEventType.MESSAGE_SENT:
      console.log(`📤 Message sent to: ${event.data.To}`);
      if (event.data.TotalPrice) {
        console.log(`   Cost: $${event.data.TotalPrice}`);
      }
      if (event.data.Segments) {
        console.log(`   Segments: ${event.data.Segments}`);
      }
      break;

    case WebhookEventType.MESSAGE_INCOMING:
      console.log(`📥 Message received from: ${event.data.From}`);
      console.log(`   Message: ${event.data.Message}`);
      break;

    case WebhookEventType.MESSAGE_EXCLUDED:
      console.log(`⚠️ Message excluded: ${event.data.ExcludedReason}`);
      break;

    case WebhookEventType.MESSAGE_ERROR_CARRIER:
      console.log(`❌ Carrier error ${event.data.ErrorCode}: ${event.data.ErrorMessage}`);
      break;

    case WebhookEventType.MESSAGE_ERROR_CLOUDCONTACT:
      console.log(`🚨 System error ${event.data.ErrorCode}: ${event.data.ErrorMessage}`);
      break;

    default:
      console.warn('Unknown event type:', event.eventType);
  }

  // Handle custom data if present
  if (event.data.CustomData) {
    console.log(`📌 Custom Data: ${event.data.CustomData}`);
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
