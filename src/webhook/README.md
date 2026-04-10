# CloudContactAI Webhook Integration

This module provides functionality for integrating with CloudContactAI's webhook system. Webhooks allow you to receive real-time notifications when certain events occur in your CloudContactAI account, such as when messages are sent or received.

## Webhook Events

CloudContactAI currently supports the following webhook events:

1. **Message Sent (Outbound)** - Triggered when a message is sent from your CloudContactAI account
2. **Message Received (Inbound)** - Triggered when a message is received by your CloudContactAI account

## Event Payload Schema

### Message Sent Event

```json
{
  "type": "message.sent",
  "campaign": {
    "id": 123,
    "title": "Default Campaign",
    "message": "",
    "senderPhone": "+11234567894",
    "createdAt": "2025-07-14 22:18:28.273",
    "runAt": ""
  },
  "from": "+11234567894",
  "to": "+11453215437",
  "message": "this is a test message for Jon Doe"
}
```

### Message Received Event

```json
{
  "type": "message.received",
  "campaign": {
    "id": 123,
    "title": "Default Campaign",
    "message": "",
    "senderPhone": "+11234567894",
    "createdAt": "2025-07-14 22:18:28.273",
    "runAt": ""
  },
  "from": "+11453215437",
  "to": "+11234567894",
  "message": "this is a reply message from Jon Doe"
}
```

## Usage with Next.js

The ccai-node library provides a convenient utility for handling webhooks in Next.js applications:

```typescript
// pages/api/ccai-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler, WebhookEventType } from 'ccai-node';

export default createWebhookHandler({
  // Optional: Secret for verifying webhook signatures
  secret: process.env.CCAI_WEBHOOK_SECRET,
  
  // Handler for outbound messages
  onMessageSent: async (event) => {
    console.log('Message sent:', event);
    // Process outbound message event
  },
  
  // Handler for inbound messages
  onMessageReceived: async (event) => {
    console.log('Message received:', event);
    // Process inbound message event
  }
});
```

## Registering a Webhook

To register a webhook with CloudContactAI:

```typescript
const ccai = new CCAI({
  clientId: 'your-client-id',
  apiKey: 'your-api-key'
});

// Register a new webhook
const webhook = await ccai.webhook.register({
  url: 'https://your-app.com/api/ccai-webhook',
  events: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_RECEIVED
  ],
  secret: 'your-webhook-secret' // Optional but recommended for security
});
```

## Webhook Security

For production use, it's recommended to use a webhook secret to verify that webhook requests are coming from CloudContactAI. The secret is used to create a signature that is sent with each webhook request in the `X-CCAI-Signature` header.

When you configure your webhook in the CloudContactAI interface (Settings -> Integrations), you can set a secret. This same secret should be used when setting up your webhook handler.

## Manual Webhook Handling

If you prefer to handle webhooks manually without using the provided utilities:

```typescript
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log('Webhook payload:', payload);
    
    // Process the webhook based on its type
    if (payload.type === 'message.sent') {
      // Handle outbound message event
    } else if (payload.type === 'message.received') {
      // Handle inbound message event
    }
    
    // Always respond with a 200 status code to acknowledge receipt
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```
