// Simple webhook handler for CloudContactAI
// This would typically be in pages/api/ccai-webhook.js in a Next.js app

import { createWebhookHandler } from 'ccai-node';

export default createWebhookHandler({
  // Handler for outbound messages
  onMessageSent: async (event) => {
    console.log('Message sent:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
  },
  
  // Handler for inbound messages
  onMessageReceived: async (event) => {
    console.log('Message received:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
  },
  
  logEvents: true
});