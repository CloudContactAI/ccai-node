/**
 * webhook.ts - A TypeScript module for managing CloudContactAI webhooks
 * This module provides functionality to configure and manage webhooks for CCAI events.
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { CCAI } from '../ccai';
import { WebhookConfig, WebhookEvent } from './types';

/**
 * Service for managing CloudContactAI webhook endpoints
 */
export class Webhook {
  private ccai: CCAI;

  /**
   * Create a new Webhook instance
   * @param ccai - CCAI client instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Register a new webhook endpoint
   * @param config - Webhook configuration (url required, secret is optional)
   * @returns Promise resolving to the registered webhook details (including secretKey)
   */
  async register(config: WebhookConfig): Promise<{
    id: string;
    url: string;
    method: string;
    integrationType: string;
    secretKey?: string;
  }> {
    const secret = config.secretKey || config.secret;

    // Build payload with optional secretKey
    // If secretKey is not provided, the server will generate one automatically
    const webhookPayload: Record<string, unknown> = {
      url: config.url,
      method: 'POST',
      integrationType: config.integrationType || 'ALL',
    };

    // Only include secretKey if explicitly provided
    if (secret) {
      webhookPayload.secretKey = secret;
    }

    const payload = [webhookPayload];

    const result = await this.ccai.request(
      'POST',
      `/v1/client/${this.ccai.getClientId()}/integration`,
      payload
    );

    // API returns an array — return the first element
    if (Array.isArray(result) && result[0]) {
      return result[0];
    }
    return result as {
      id: string;
      url: string;
      method: string;
      integrationType: string;
      secretKey?: string;
    };
  }

  /**
   * Update an existing webhook configuration
   * @param id - Webhook ID
   * @param config - Updated webhook configuration
   * @returns Promise resolving to the updated webhook details
   */
  async update(
    id: string,
    config: Partial<WebhookConfig>
  ): Promise<{
    id: string;
    url: string;
    method: string;
    integrationType: string;
    secretKey?: string;
  }> {
    const secret = config.secretKey || config.secret;

    // Build payload with optional secretKey
    const webhookPayload: Record<string, unknown> = {
      id: parseInt(id, 10),
      url: config.url || '',
      method: config.method || 'POST',
      integrationType: config.integrationType || 'ALL',
    };

    // Only include secretKey if explicitly provided
    if (secret) {
      webhookPayload.secretKey = secret;
    }

    const payload = [webhookPayload];

    const result = await this.ccai.request(
      'POST',
      `/v1/client/${this.ccai.getClientId()}/integration`,
      payload
    );

    // API returns an array — return the first element
    if (Array.isArray(result) && result[0]) {
      return result[0];
    }
    return result as {
      id: string;
      url: string;
      method: string;
      integrationType: string;
      secretKey?: string;
    };
  }

  /**
   * List all registered webhooks
   * @returns Promise resolving to an array of webhook configurations
   */
  async list(): Promise<
    Array<{ id: string; url: string; method: string; integrationType: string }>
  > {
    return this.ccai.request('GET', `/v1/client/${this.ccai.getClientId()}/integration`);
  }

  /**
   * Delete a webhook
   * @param id - Webhook ID
   * @returns Promise resolving to a success response
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.ccai.request('DELETE', `/v1/client/${this.ccai.getClientId()}/integration/${id}`);
  }

  /**
   * Verify a webhook signature using HMAC-SHA256
   * Signature is computed as: HMAC-SHA256(secretKey, clientId:eventHash) encoded in Base64
   * @param signature - Signature from the X-CCAI-Signature header (Base64 encoded)
   * @param clientId - Client ID
   * @param eventHash - Event hash from the webhook payload
   * @param secret - Webhook secret key
   * @returns True if the signature is valid
   */
  verifySignature(
    signature: string,
    clientId: string | number,
    eventHash: string,
    secret: string
  ): boolean {
    if (!signature || !clientId || !eventHash || !secret) {
      return false;
    }

    try {
      // Compute: HMAC-SHA256(secretKey, "$clientId:$eventHash")
      const data = `${clientId}:${eventHash}`;
      const computed = createHmac('sha256', secret).update(data).digest('base64');

      // Constant-time comparison to prevent timing attacks
      return timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch {
      return false;
    }
  }

  /**
   * Parse a raw webhook JSON payload into a structured event
   * @param payload - Raw JSON payload string
   * @returns Parsed webhook event object
   * @throws Error if the payload is invalid JSON
   */
  parseEvent(payload: string): WebhookEvent {
    try {
      return JSON.parse(payload) as WebhookEvent;
    } catch (error) {
      throw new Error(
        `Invalid JSON payload: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }
}
