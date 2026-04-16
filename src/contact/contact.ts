/**
 * contact.ts - A TypeScript module for managing contact preferences via CloudContactAI
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI } from '../ccai';

/**
 * Response from the setDoNotText API
 */
export type SetDoNotTextResponse = {
  /** Contact ID */
  contactId?: string;
  /** Phone number */
  phone?: string;
  /** Whether the contact is opted out of text messages */
  doNotText?: boolean;
  /** Additional data from the API */
  [key: string]: unknown;
};

/**
 * Service for managing contact preferences (opt-out)
 */
export class Contact {
  private ccai: CCAI;

  /**
   * Create a new Contact service instance
   * @param ccai - The parent CCAI instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Set the do-not-text preference for a contact
   * @param doNotText - True to opt out, false to opt in
   * @param contactId - Contact ID (optional if phone is provided)
   * @param phone - Phone number in E.164 format (optional if contactId is provided)
   * @returns Promise resolving to the API response
   */
  async setDoNotText(
    doNotText: boolean,
    contactId?: string,
    phone?: string
  ): Promise<SetDoNotTextResponse> {
    const payload: Record<string, unknown> = {
      clientId: this.ccai.getClientId(),
      doNotText,
    };

    if (contactId !== undefined) {
      payload.contactId = contactId;
    }

    if (phone !== undefined) {
      payload.phone = phone;
    }

    return this.ccai.request<SetDoNotTextResponse>('PUT', '/account/do-not-text', payload);
  }
}
