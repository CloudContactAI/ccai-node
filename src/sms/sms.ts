/**
 * sms.ts - SMS service for the CCAI API
 * Handles sending SMS messages through the Cloud Contact AI platform.
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI, Account } from '../ccai';

export type SMSCampaign = {
  accounts: Account[];
  message: string;
  title: string;
};

export type SMSResponse = {
  // Define the expected response structure from the API
  id?: string;
  status?: string;
  campaignId?: string;
  messagesSent?: number;
  timestamp?: string;
  [key: string]: unknown;
};

export type SMSOptions = {
  /**
   * Optional timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Optional retry count for failed requests
   */
  retries?: number;
  
  /**
   * Optional callback for tracking progress
   */
  onProgress?: (status: string) => void;
};

export class SMS {
  private ccai: CCAI;

  /**
   * Create a new SMS service instance
   * @param ccai - The parent CCAI instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Send an SMS message to one or more recipients
   * @param accounts - Array of recipient objects
   * @param message - The message to send (can include ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param options - Optional settings for the SMS send operation
   * @returns Promise resolving to the API response
   */
  async send(
    accounts: Account[], 
    message: string, 
    title: string,
    options?: SMSOptions
  ): Promise<SMSResponse> {
    // Validate inputs
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('At least one account is required');
    }
    
    if (!message) throw new Error('Message is required');
    if (!title) throw new Error('Campaign title is required');
    
    // Validate each account has the required fields
    accounts.forEach((account, index) => {
      if (!account.firstName) throw new Error(`First name is required for account at index ${index}`);
      if (!account.lastName) throw new Error(`Last name is required for account at index ${index}`);
      if (!account.phone) throw new Error(`Phone number is required for account at index ${index}`);
    });
    
    // Notify progress if callback provided
    if (options?.onProgress) {
      options.onProgress('Preparing to send SMS');
    }
    
    const endpoint = `/clients/${this.ccai.getClientId()}/campaigns/direct`;
    
    const campaignData: SMSCampaign = {
      accounts,
      message,
      title
    };
    
    try {
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('Sending SMS');
      }
      
      // Make the API request
      const response = await this.ccai.request<SMSResponse>('post', endpoint, campaignData);
      
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('SMS sent successfully');
      }
      
      return response;
    } catch (error) {
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('SMS sending failed');
      }
      
      throw error;
    }
  }

  /**
   * Send a single SMS message to one recipient
   * @param firstName - Recipient's first name
   * @param lastName - Recipient's last name
   * @param phone - Recipient's phone number (E.164 format)
   * @param message - The message to send (can include ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param options - Optional settings for the SMS send operation
   * @returns Promise resolving to the API response
   */
  async sendSingle(
    firstName: string,
    lastName: string,
    phone: string,
    message: string,
    title: string,
    options?: SMSOptions
  ): Promise<SMSResponse> {
    const account: Account = {
      firstName,
      lastName,
      phone
    };
    
    return this.send([account], message, title, options);
  }
}
