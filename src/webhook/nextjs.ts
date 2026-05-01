/**
 * nextjs.ts - Utilities for handling CloudContactAI webhooks in Next.js applications
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEvent, WebhookEventType } from './types';

export interface WebhookHandlerOptions {
  /**
   * Secret used to verify webhook signatures
   */
  secret?: string;

  /**
   * Handler for Message Sent events
   */
  onMessageSent?: (event: WebhookEvent) => Promise<void> | void;

  /**
   * Handler for Message Received events
   */
  onMessageReceived?: (event: WebhookEvent) => Promise<void> | void;

  /**
   * Whether to log events to console
   */
  logEvents?: boolean;
}

/**
 * Create a Next.js API route handler for CloudContactAI webhooks
 *
 * @param options - Configuration options for the webhook handler
 * @returns Next.js API route handler function
 *
 * @example
 * ```typescript
 * // pages/api/ccai-webhook.ts
 * import type { NextApiRequest, NextApiResponse } from 'next';
 * import { createWebhookHandler } from 'ccai-node';
 * import { CCAI } from 'ccai-node';
 *
 * const ccai = new CCAI({
 *   clientId: process.env.CCAI_CLIENT_ID || '',
 *   apiKey: process.env.CCAI_API_KEY || ''
 * });
 *
 * export default createWebhookHandler({
 *   secret: process.env.CCAI_WEBHOOK_SECRET,
 *   onMessageSent: async (event) => {
 *     console.log('Message sent:', event);
 *     // Process outbound message event
 *   },
 *   onMessageReceived: async (event) => {
 *     console.log('Message received:', event);
 *     // Process inbound message event
 *   }
 * });
 * ```
 */
export function createWebhookHandler(options: WebhookHandlerOptions = {}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Get the request body
      const body = req.body as WebhookEvent;

      // Log the event if enabled
      if (options.logEvents) {
        console.log('CloudContactAI webhook event:', body);
      }

      // Handle the event based on type
      switch (body.eventType) {
        case WebhookEventType.MESSAGE_SENT:
          if (options.onMessageSent) {
            await options.onMessageSent(body);
          }
          break;

        case WebhookEventType.MESSAGE_RECEIVED:
          if (options.onMessageReceived) {
            await options.onMessageReceived(body);
          }
          break;

        default:
          // Unknown event type
          console.warn('Unknown webhook event type:', body.eventType);
      }

      // Return success
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
