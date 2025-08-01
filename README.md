# CloudContactAI Node.js Client - [CloudContactAI](https://www.cloudcontactai.com)

A TypeScript client for the Cloud Contact AI API that allows you to easily send SMS and MMS messages, and handle webhook callbacks.

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

### Webhooks

CloudContactAI can send webhook notifications when certain events occur, such as when messages are sent or received. The library provides utilities to handle these webhook events in Next.js applications.

#### Webhook Events

CloudContactAI currently supports the following webhook events:

1. **Message Sent (Outbound)** - Triggered when a message is sent from your CloudContactAI account
2. **Message Received (Inbound)** - Triggered when a message is received by your CloudContactAI account

#### Event Payload Schema

**Message Sent Event:**
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

**Message Received Event:**
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

#### Using Webhooks with Next.js

```typescript
// pages/api/ccai-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler, WebhookEventType } from 'ccai-node';

export default createWebhookHandler({
  // Optional: Secret for verifying webhook signatures
  secret: process.env.CCAI_WEBHOOK_SECRET,
  
  // Handler for outbound messages
  onMessageSent: async (event) => {
    console.log('Message sent event received:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
    
    // Your custom logic here
  },
  
  // Handler for inbound messages
  onMessageReceived: async (event) => {
    console.log('Message received event received:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
    
    // Your custom logic here
  },
  
  // Optional: Log events to console
  logEvents: true
});
```

#### Simple Webhook Handler

If you prefer a simpler approach, you can handle webhooks manually:

```typescript
// pages/api/simple-webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log('Webhook payload:', payload);
    
    // Process the webhook based on its type
    if (payload.type === 'message.sent') {
      // Handle outbound message event
    } else if (payload.type === 'message.received') {
      // Handle inbound message event
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
  - `sms/` - SMS-related functionality
    - `sms.ts` - SMS service class
    - `mms.ts` - MMS service class
  - `webhook/` - Webhook-related functionality
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
- Support for sending SMS to multiple recipients
- Support for sending MMS with images
- Upload images to S3 with signed URLs
- Webhook integration for real-time event notifications
- Next.js API route handlers for webhook events
- Support for template variables (firstName, lastName)
- Progress tracking via callbacks
- Comprehensive error handling
- Unit tests with Jest
- Code quality tools with Biome
- Automated dependency updates with Renovate
- CI/CD with GitHub Actions
- Modern Node.js support (v18+, optimized for v24.1.0)

## License

MIT © 2025 CloudContactAI LLC
