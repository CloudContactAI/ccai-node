/**
 * Example of using CloudContactAI webhooks
 *
 * This example shows how to handle webhook events from CloudContactAI.
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI, type WebhookEvent, WebhookEventType } from '../index';

// Initialize CCAI client
const ccai = new CCAI({
  clientId: process.env.CCAI_CLIENT_ID || '',
  apiKey: process.env.CCAI_API_KEY || '',
});

/**
 * Example webhook event handler
 */
export function handleWebhookEvent(event: WebhookEvent) {
  console.log(`Webhook Event: ${event.eventType}`);
  console.log(`Event Hash: ${event.eventHash}`);

  switch (event.eventType) {
    case WebhookEventType.MESSAGE_SENT:
      console.log('✅ Message sent successfully');
      if (event.data.To) {
        console.log(`   Recipient: ${event.data.To}`);
      }
      if (event.data.TotalPrice) {
        console.log(`   Cost: $${event.data.TotalPrice}`);
      }
      if (event.data.Segments) {
        console.log(`   Segments: ${event.data.Segments}`);
      }
      break;

    case WebhookEventType.MESSAGE_INCOMING:
      console.log('📥 Message received (reply)');
      if (event.data.From) {
        console.log(`   From: ${event.data.From}`);
      }
      if (event.data.Message) {
        console.log(`   Message: ${event.data.Message}`);
      }
      break;

    case WebhookEventType.MESSAGE_EXCLUDED:
      console.log('⚠️ Message excluded');
      if (event.data.ExcludedReason) {
        console.log(`   Reason: ${event.data.ExcludedReason}`);
      }
      break;

    case WebhookEventType.MESSAGE_ERROR_CARRIER:
      console.log('❌ Carrier error');
      if (event.data.ErrorCode) {
        console.log(`   Code: ${event.data.ErrorCode}`);
      }
      if (event.data.ErrorMessage) {
        console.log(`   Message: ${event.data.ErrorMessage}`);
      }
      break;

    case WebhookEventType.MESSAGE_ERROR_CLOUDCONTACT:
      console.log('🚨 System error');
      if (event.data.ErrorCode) {
        console.log(`   Code: ${event.data.ErrorCode}`);
      }
      if (event.data.ErrorMessage) {
        console.log(`   Message: ${event.data.ErrorMessage}`);
      }
      break;

    default:
      console.log(`Unknown event type: ${event.eventType}`);
  }

  // Handle custom data if present
  if (event.data.CustomData) {
    console.log(`📌 Custom Data: ${event.data.CustomData}`);
  }
}

/**
 * Example webhook signature verification
 */
export function verifyAndHandleWebhook(
  signature: string,
  clientId: string,
  eventHash: string,
  secret: string,
  payload: WebhookEvent
) {
  const isValid = ccai.webhook.verifySignature(signature, clientId, eventHash, secret);

  if (isValid) {
    console.log('✅ Webhook signature verified');
    handleWebhookEvent(payload);
  } else {
    console.log('❌ Invalid webhook signature - rejecting');
  }
}
