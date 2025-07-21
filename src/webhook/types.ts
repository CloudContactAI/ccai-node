/**
 * Types for CloudContactAI webhook events
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

/**
 * Campaign information included in webhook events
 */
export interface WebhookCampaign {
  id: number;
  title: string;
  message: string;
  senderPhone: string;
  createdAt: string;
  runAt: string;
}

/**
 * Base interface for all webhook events
 */
export interface WebhookEventBase {
  campaign: WebhookCampaign;
  from: string;
  to: string;
  message: string;
}

/**
 * Event types supported by CloudContactAI webhooks
 */
export enum WebhookEventType {
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received'
}

/**
 * Message Sent (Outbound) webhook event
 */
export interface MessageSentEvent extends WebhookEventBase {
  type: WebhookEventType.MESSAGE_SENT;
}

/**
 * Message Received (Inbound) webhook event
 */
export interface MessageReceivedEvent extends WebhookEventBase {
  type: WebhookEventType.MESSAGE_RECEIVED;
}

/**
 * Union type for all webhook events
 */
export type WebhookEvent = MessageSentEvent | MessageReceivedEvent;

/**
 * Configuration for webhook integration
 */
export interface WebhookConfig {
  url: string;
  events: WebhookEventType[];
  secret?: string; // Optional secret for webhook signature verification
}
