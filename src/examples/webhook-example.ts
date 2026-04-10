/**
 * Example of using CloudContactAI webhooks with Next.js
 * 
 * This example shows how to create a Next.js API route that handles
 * webhook events from CloudContactAI.
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createWebhookHandler, WebhookEventType } from '../index';

/**
 * Example Next.js API route handler for CloudContactAI webhooks
 * This would typically be in a file like pages/api/ccai-webhook.ts
 */
export default createWebhookHandler({
  // Optional: Secret for verifying webhook signatures
  // secret: process.env.CCAI_WEBHOOK_SECRET,
  
  // Handler for outbound messages (messages sent from your campaigns)
  onMessageSent: async (event) => {
    console.log('Message sent event received:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
    
    // Here you can add your custom logic for handling sent messages
    // For example, updating your database, triggering other processes, etc.
  },
  
  // Handler for inbound messages (replies from recipients)
  onMessageReceived: async (event) => {
    console.log('Message received event received:');
    console.log(`Campaign: ${event.campaign.title} (ID: ${event.campaign.id})`);
    console.log(`From: ${event.from}`);
    console.log(`To: ${event.to}`);
    console.log(`Message: ${event.message}`);
    
    // Here you can add your custom logic for handling received messages
    // For example, updating your database, triggering automated responses, etc.
  },
  
  // Optional: Log events to console
  logEvents: true
});

/**
 * Example of a basic Next.js API route that manually handles webhooks
 */
export function manualWebhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log('Webhook payload:', payload);
    
    // Process the webhook based on its type
    if (payload.type === WebhookEventType.MESSAGE_SENT) {
      // Handle outbound message event
      console.log('Message sent to:', payload.to);
    } else if (payload.type === WebhookEventType.MESSAGE_RECEIVED) {
      // Handle inbound message event
      console.log('Message received from:', payload.from);
    }
    
    // Always respond with a 200 status code to acknowledge receipt
    res.status(200).json({ received: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
