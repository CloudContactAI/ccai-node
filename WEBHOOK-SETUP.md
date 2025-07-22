# CCAI Webhook Setup Guide

## Quick Start

### 1. Start the webhook server

```bash
# TypeScript version (recommended)
npm run webhook:ts

# Or JavaScript version
npm run webhook:js
```

### 2. Test the webhook

In another terminal:
```bash
node test-webhook.js
```

### 3. Configure CloudContactAI

1. Go to CloudContactAI Settings → Integrations
2. Add webhook URL: `http://localhost:3000/webhook`
3. Select events: Message Sent, Message Received
4. Save configuration

## Production Setup

### Using ngrok for testing

```bash
# Install ngrok
npm install -g ngrok

# Start your webhook server
npm run webhook:ts

# In another terminal, expose localhost
ngrok http 3000

# Use the ngrok URL in CloudContactAI settings
# Example: https://abc123.ngrok.io/webhook
```

### Environment Variables

Create a `.env` file:
```
PORT=3000
CCAI_WEBHOOK_SECRET=your-secret-here
```

## Webhook Events

The server handles these events:

- `message.sent` - Outbound messages
- `message.received` - Inbound messages

## Endpoints

- `POST /webhook` - CCAI webhook handler
- `GET /health` - Health check

Server runs on port 3000 by default.