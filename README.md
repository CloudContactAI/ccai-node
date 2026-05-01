# CloudContactAI Node.js Client - [CloudContactAI](https://www.cloudcontactai.com)

A TypeScript client for the Cloud Contact AI API that allows you to easily send SMS and MMS messages, send email campaigns, manage webhooks, and manage contact opt-out preferences.

## Requirements

- Node.js v18.0.0 or higher (optimized for Node.js v24.1.0)

## Installation

```bash
npm install ccai-node
```

## Build

```bash
npm run build
```

## Usage

### SMS

```typescript
import { CCAI } from 'ccai-node';

// Initialize the client
const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Send an SMS to multiple recipients
const accounts = [
  {
    firstName: "John",
    lastName: "Doe",
    phone: "+15551234567"
  }
];

ccai.sms.send(
  accounts,
  "Hello ${firstName} ${lastName}, this is a test message!",
  "Test Campaign"
)
  .then(response => console.log('Success:', response))
  .catch(error => console.error('Error:', error));

// Send an SMS to a single recipient
ccai.sms.sendSingle(
  "Jane",
  "Smith",
  "+15559876543",
  "Hi ${firstName}, thanks for your interest!",
  "Single Message Test"
)
  .then(response => console.log('Success:', response))
  .catch(error => console.error('Error:', error));
```

### MMS

```typescript
import { CCAI, Account, SMSOptions } from 'ccai-node';

// Initialize the client
const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Define a progress callback
const trackProgress = (status: string) => {
  console.log(`Progress: ${status}`);
};

// Create options with progress tracking
const options: SMSOptions = {
  timeout: 60000,
  onProgress: trackProgress
};

// Complete MMS workflow (get URL, upload image, send MMS)
async function sendMmsWithImage() {
  try {
    // Path to your image file
    const imagePath = 'path/to/your/image.jpg';
    const contentType = 'image/jpeg';
    
    // Define recipient
    const account: Account = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567'
    };
    
    // Send MMS with image in one step
    const response = await ccai.mms.sendWithImage(
      imagePath,
      contentType,
      [account],
      "Hello ${firstName}, check out this image!",
      "MMS Campaign Example",
      options
    );
    
    console.log(`MMS sent! Campaign ID: ${response.campaignId}`);
  } catch (error) {
    console.error('Error sending MMS:', error);
  }
}

// Call the function
sendMmsWithImage();
```

### Email

```typescript
import { CCAI } from 'ccai-node';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Send a single email
const response = await ccai.email.sendSingle(
  'John',
  'Doe',
  'john@example.com',
  'Welcome to Our Service',
  '<p>Hello ${firstName},</p><p>Thank you for signing up!</p>',
  'noreply@yourcompany.com',
  'support@yourcompany.com',
  'Your Company',
  'Welcome Email'
);
console.log('Email sent:', response);

// Send an email campaign to multiple recipients
const accounts = [
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
];

const campaignResponse = await ccai.email.send(
  accounts,
  'Monthly Newsletter',
  '<h1>Hello ${firstName}!</h1><p>Monthly updates...</p>',
  'newsletter@yourcompany.com',
  'support@yourcompany.com',
  'Your Company Newsletter',
  'July 2025 Newsletter'
);
console.log('Campaign sent:', campaignResponse);
```

### Contact

Manage opt-out preferences for contacts.

```typescript
import { CCAI } from 'ccai-node';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Opt a contact out of text messages (by phone number)
const result = await ccai.contact.setDoNotText(true, undefined, '+15551234567');
console.log('Opted out:', result);

// Opt a contact back in (by phone number)
await ccai.contact.setDoNotText(false, undefined, '+15551234567');

// Opt out by contactId
await ccai.contact.setDoNotText(true, 'contact-abc-123');
```

### Webhooks

CloudContactAI can send webhook notifications when certain events occur, such as when messages are sent or received. Use the Webhook service to register, manage, and verify webhooks programmatically.

#### Managing Webhooks

```typescript
import { CCAI, WebhookConfig, WebhookEventType } from 'ccai-node';

const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Example 1: Register a new webhook - server generates secret automatically
const webhookConfig: WebhookConfig = {
  url: 'https://your-app.com/api/ccai-webhook',
  // secret is optional - if not provided, server generates one automatically
};
const webhook = await ccai.webhook.register(webhookConfig);
console.log('Webhook registered with ID:', webhook.id);
console.log('Secret Key:', webhook.secretKey);  // Save this securely!

// Example 2: Register with custom secret and event types
const webhookCustomConfig: WebhookConfig = {
  url: 'https://your-app.com/api/custom-webhook',
  secret: 'your-custom-secret',  // optional - user-provided secret
  events: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_RECEIVED
  ]
};
const webhookCustom = await ccai.webhook.register(webhookCustomConfig);
console.log('Custom secret webhook registered:', webhookCustom.id);

// List all registered webhooks
const webhooks = await ccai.webhook.list();
console.log('Registered webhooks:', webhooks.length);
webhooks.forEach(wh => {
  console.log(`- ID: ${wh.id}, URL: ${wh.url}`);
});

// Update a webhook
const updateConfig: WebhookConfig = {
  url: 'https://your-app.com/api/new-webhook',
  events: [WebhookEventType.MESSAGE_SENT]
};
const updated = await ccai.webhook.update(webhook.id, updateConfig);
console.log('Updated webhook URL:', updated.url);

// Delete a webhook
await ccai.webhook.delete(webhook.id);

// Verify webhook signature (in your incoming request handler)
const signature = req.headers['x-ccai-signature'] as string;
const clientId = ccai.clientId;
const eventHash = req.body.eventHash as string;  // From the webhook payload
const secret = 'your-webhook-secret';
const isValid = ccai.webhook.verifySignature(signature, clientId, eventHash, secret);

// Parse incoming webhook event
const event = ccai.webhook.parseEvent(JSON.stringify(req.body));
console.log('Event type:', event.eventType);   // 'message.sent' | 'message.received'
console.log('Event data:', event.data);
console.log('To:', event.data.To);
console.log('From:', event.data.From);
console.log('Message:', event.data.Message);
```

#### Webhook Events

CloudContactAI currently supports the following webhook events:

1. **Message Sent (Outbound)** - Triggered when a message is sent from your CloudContactAI account
2. **Message Received (Inbound)** - Triggered when a message is received by your CloudContactAI account

#### Event Payload Schema

**Message Sent Event:**
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

**Message Received Event:**
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

#### Using Webhooks with Next.js

```typescript
// pages/api/ccai-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler, WebhookEventType, type WebhookEvent } from 'ccai-node';

export default createWebhookHandler({
  // Optional: Secret for verifying webhook signatures
  secret: process.env.CCAI_WEBHOOK_SECRET,
  
  // Handler for outbound messages (type-safe)
  onMessageSent: async (event: WebhookEvent) => {
    console.log('Message sent event received:');
    console.log(`Event Type: ${event.eventType}`);
    console.log(`Event Hash: ${event.eventHash}`);
    console.log('Event Data:');
    console.log(`- To: ${event.data.To}`);
    console.log(`- From: ${event.data.From}`);
    console.log(`- Message: ${event.data.Message}`);
    console.log(`- Campaign ID: ${event.data.CampaignId}`);
    
    // Your custom logic here
  },
  
  // Handler for inbound messages (type-safe)
  onMessageReceived: async (event: WebhookEvent) => {
    console.log('Message received event received:');
    console.log(`Event Type: ${event.eventType}`);
    console.log('Event Data:');
    console.log(`- From: ${event.data.From}`);
    console.log(`- To: ${event.data.To}`);
    console.log(`- Message: ${event.data.Message}`);
    
    // Your custom logic here
  },
  
  // Optional: Log events to console
  logEvents: true
});
```

#### Simple Webhook Handler

If you prefer a simpler approach, you can handle webhooks manually with type safety:

```typescript
// pages/api/simple-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { CCAI, type WebhookEvent, WebhookEventType } from 'ccai-node';

const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID!,
  apiKey: process.env.CCAI_API_KEY!
});

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const payload = req.body as WebhookEvent;
    console.log('Webhook payload:', payload);
    console.log('Event Type:', payload.eventType);
    console.log('Event Hash:', payload.eventHash);
    
    // Verify signature if you have the secret
    const signature = req.headers['x-ccai-signature'] as string;
    const secret = process.env.CCAI_WEBHOOK_SECRET;
    
    if (secret && !ccai.webhook.verifySignature(
      signature,
      process.env.CCAI_CLIENT_ID!,
      payload.eventHash,
      secret
    )) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the webhook based on its eventType (type-safe)
    if (payload.eventType === WebhookEventType.MESSAGE_SENT) {
      // Handle outbound message event
      console.log('Message sent to:', payload.data.To);
      console.log('Total Price:', payload.data.TotalPrice);
    } else if (payload.eventType === WebhookEventType.MESSAGE_RECEIVED) {
      // Handle inbound message event
      console.log('Message received from:', payload.data.From);
      console.log('Message:', payload.data.Message);
    }
    
    // Always respond with a 200 status code
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
```

#### Configuring Webhooks

Webhooks are configured in the CloudContactAI interface under Settings -> Integrations. You'll need to provide:

1. A webhook URL (e.g., https://your-app.com/api/ccai-webhook)
2. The events you want to receive (Message Sent, Message Received)
3. Optionally, a secret for webhook signature verification

### Using Async/Await

```typescript
async function sendMessages() {
  try {
    // Send to multiple recipients
    const response = await ccai.sms.send(
      accounts,
      "Hello ${firstName} ${lastName}!",
      "Test Campaign"
    );
    console.log('Success:', response);
    
    // Send with progress tracking
    const options = {
      onProgress: (status) => console.log(`Status: ${status}`)
    };
    
    await ccai.sms.sendSingle(
      "Jane",
      "Smith",
      "+15559876543",
      "Hi ${firstName}!",
      "Test Campaign",
      options
    );
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Project Structure

- `src/` - Source code
  - `ccai.ts` - Main CCAI client class
  - `sms/` - SMS and MMS functionality
    - `sms.ts` - SMS service class
    - `mms.ts` - MMS service class
  - `email/` - Email functionality
    - `email.ts` - Email service class
  - `contact/` - Contact management
    - `contact.ts` - Contact service class (opt-out)
  - `webhook/` - Webhook functionality
    - `webhook.ts` - Webhook service (register, list, update, delete, verify)
    - `types.ts` - Type definitions for webhook events
    - `nextjs.ts` - Next.js integration utilities
  - `index.ts` - Main exports
  - `examples/` - Example usage
  - `__tests__/` - Test files
- `dist/` - Compiled JavaScript (generated after build)
- `.github/` - GitHub workflows and configurations
  - `workflows/` - CI/CD workflows
  - `renovate.json` - Dependency update configuration

## Development

### Prerequisites

- Node.js v18.0.0 or higher (v24.1.0 recommended)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

### Node Version Management

This project includes an `.nvmrc` file specifying Node.js v24.1.0. If you use nvm, you can run:

```bash
nvm use
```

to automatically switch to the correct Node.js version.

### Testing

Run tests with Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Linting and Formatting

This project uses Biome for linting and formatting:

```bash
# Check for linting issues
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format

# Fix formatting issues
npm run format:fix
```

### Continuous Integration

This project uses GitHub Actions for CI/CD:

- Runs tests on Node.js 18, 20, and 24
- Checks code formatting and linting
- Generates and uploads test coverage reports

### Dependency Management

This project uses Renovate for automated dependency updates:

- Automatically creates PRs for dependency updates
- Configures automerge for minor and patch updates
- Groups related dependency updates together
- Runs on a weekly schedule (weekends)

### Git Ignored Files

This project includes a `.gitignore` file that excludes:
- `node_modules/` - Dependencies
- `dist/` - Compiled output
- `coverage/` - Test coverage reports
- IDE files (`.vscode/`, `.idea/`, etc.)
- Log files
- Environment variables (`.env`)
- Temporary files

## Features

- TypeScript support with full type definitions
- Promise-based API with async/await support
- Send SMS to single or multiple recipients
- Send MMS with images (automatic upload to S3)
- Send Email campaigns with HTML content to single or multiple recipients
- Manage contact opt-out preferences (setDoNotText)
- Webhook management: register, list, update, delete
- Webhook signature verification (HMAC-SHA256)
- Next.js API route handlers for webhook events
- Template variable substitution (`${firstName}`, `${lastName}`)
- Progress tracking via callbacks
- Comprehensive error handling
- Unit tests with Jest
- Code quality tools with Biome
- Automated dependency updates with Renovate
- CI/CD with GitHub Actions
- Modern Node.js support (v18+, optimized for v24.1.0)

## License

MIT © 2025 CloudContactAI LLC
