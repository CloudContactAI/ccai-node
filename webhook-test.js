// Test webhook functionality locally
import { CCAI } from './dist/index.js';

const ccai = new CCAI({
  clientId: '2682',
  apiKey: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpbmZvQGFsbGNvZGUuY29tIiwiaXNzIjoiY2xvdWRjb250YWN0IiwibmJmIjoxNzE5NDQwMjM2LCJpYXQiOjE3MTk0NDAyMzYsInJvbGUiOiJVU0VSIiwiY2xpZW50SWQiOjI2ODIsImlkIjoyNzY0LCJ0eXBlIjoiQVBJX0tFWSIsImtleV9yYW5kb21faWQiOiI1MGRiOTUzZC1hMjUxLTRmZjMtODI5Yi01NjIyOGRhOGE1YTAifQ.PKVjXYHdjBMum9cTgLzFeY2KIb9b2tjawJ0WXalsb8Bckw1RuxeiYKS1bw5Cc36_Rfmivze0T7r-Zy0PVj2omDLq65io0zkBzIEJRNGDn3gx_AqmBrJ3yGnz9s0WTMr2-F1TFPUByzbj1eSOASIKeI7DGufTA5LDrRclVkz32Oo'
});

async function testWebhooks() {
  try {
    // List existing webhooks
    const webhooks = await ccai.webhook.list();
    console.log('Existing webhooks:', webhooks);
    
    // Register a new webhook (replace with your actual webhook URL)
    const newWebhook = await ccai.webhook.register({
      url: 'https://your-app.com/api/ccai-webhook',
      events: ['message.sent', 'message.received']
    });
    console.log('Registered webhook:', newWebhook);
    
  } catch (error) {
    console.error('Webhook error:', error);
  }
}

testWebhooks();