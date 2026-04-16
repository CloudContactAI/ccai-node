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
  eventType: string;
  data: Record<string, unknown>;
  eventHash: string; // Hash computed by the backend, used for signature verification
}

/**
 * Event types supported by CloudContactAI webhooks
 */
export enum WebhookEventType {
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_INCOMING = 'message.incoming',
  MESSAGE_EXCLUDED = 'message.excluded',
  MESSAGE_ERROR_CARRIER = 'message.error.carrier',
  MESSAGE_ERROR_CLOUDCONTACT = 'message.error.cloudcontact',
}

/**
 * Generic webhook event structure
 */
export interface WebhookEvent extends WebhookEventBase {
  eventType: string;
  data: Record<string, unknown>;
  eventHash: string;
}

/**
 * Configuration for webhook integration
 */
export interface WebhookConfig {
  url: string;
  events?: WebhookEventType[];
  secret?: string; // Optional secret for webhook signature verification
  secretKey?: string; // Alternative key name
  method?: string;
  integrationType?: string;
}
