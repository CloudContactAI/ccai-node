# CloudContactAI Webhook Integration

This module provides functionality for integrating with CloudContactAI's webhook system. Webhooks allow you to receive real-time notifications when certain events occur in your CloudContactAI account, such as when messages are sent or received.

## Webhook Events

CloudContactAI supports the following webhook event types, available via the `WebhookEventType` enum (`src/webhook/types.ts`):

| Event | Value | Description |
|---|---|---|
| `MESSAGE_SENT` | `message.sent` | Outbound message sent from your account |
| `MESSAGE_RECEIVED` | `message.received` | Inbound message received by your account |
| `MESSAGE_INCOMING` | `message.incoming` | Incoming message before processing |
| `MESSAGE_EXCLUDED` | `message.excluded` | Message excluded (e.g. opted-out contact) |
| `MESSAGE_ERROR_CARRIER` | `message.error.carrier` | Carrier-side delivery error |
| `MESSAGE_ERROR_CLOUDCONTACT` | `message.error.cloudcontact` | Platform-side delivery error |

`createWebhookHandler` (see below) provides typed callbacks for `MESSAGE_SENT` and `MESSAGE_RECEIVED`. To handle the other four event types, call `ccai.webhook.parseEvent()` on the raw request body and switch on `eventType` yourself.

## Event Payload Schema

Every event uses the same shape (`WebhookEvent` type in `src/webhook/types.ts`):

```typescript
type WebhookEvent = {
  eventType: string;               // e.g. "message.sent" | "message.received"
  eventHash: string;                // used for signature verification, see below
  data: Record<string, unknown>;    // event-specific payload
};
```

### Message Sent Event

```json
{
  "eventType": "message.sent",
  "eventHash": "abc123def456ghi789",
  "data": {
    "To": "+15551234567",
    "From": "+15551234567",
    "Message": "Hello John, this is a test message",
    "TotalPrice": "0.01",
    "Segments": 1,
    "CampaignId": "123",
    "CampaignTitle": "Test Campaign"
  }
}
```

### Message Received Event

```json
{
  "eventType": "message.received",
  "eventHash": "xyz789abc123def456",
  "data": {
    "To": "+15551234567",
    "From": "+15559876543",
    "Message": "Reply from customer",
    "TotalPrice": "0.01",
    "Segments": 1,
    "CampaignId": "123",
    "CampaignTitle": "Test Campaign"
  }
}
```

## Usage with Next.js

The ccai-node library provides a convenient utility for handling webhooks in Next.js applications. `createWebhookHandler` does not verify the request signature itself — for that, use the manual handling pattern in [Manual Webhook Handling](#manual-webhook-handling) below.

```typescript
// pages/api/ccai-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler, WebhookEventType, type WebhookEvent } from 'ccai-node';

export default createWebhookHandler({
  // Handler for outbound messages
  onMessageSent: async (event: WebhookEvent) => {
    console.log('Message sent:', event.eventType, event.data);
    // Process outbound message event
  },

  // Handler for inbound messages
  onMessageReceived: async (event: WebhookEvent) => {
    console.log('Message received:', event.eventType, event.data);
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
  secret: 'your-webhook-secret' // Optional but recommended for security
});
```

## Webhook Security

For production use, it's recommended to use a webhook secret to verify that webhook requests are coming from CloudContactAI. The secret is used to create a signature that is sent with each webhook request in the `X-CCAI-Signature` header.

When you configure your webhook in the CloudContactAI interface (Settings -> Integrations), you can set a secret. This same secret should be used when setting up your webhook handler, passed to `ccai.webhook.verifySignature(signature, clientId, eventHash, secret)`.

## Manual Webhook Handling

If you prefer to handle webhooks manually without using the provided utilities:

```typescript
import { CCAI } from 'ccai-node';

const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID!,
  apiKey: process.env.CCAI_API_KEY!
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const payload = req.body as { eventType: string; eventHash: string; data: Record<string, unknown> };

    const signature = req.headers['x-ccai-signature'] as string;
    const secret = process.env.CCAI_WEBHOOK_SECRET!;
    if (!ccai.webhook.verifySignature(signature, process.env.CCAI_CLIENT_ID!, payload.eventHash, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the webhook based on its eventType
    if (payload.eventType === 'message.sent') {
      // Handle outbound message event
    } else if (payload.eventType === 'message.received') {
      // Handle inbound message event
    }

    // Always respond with a 200 status code to acknowledge receipt
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```
