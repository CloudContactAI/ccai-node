/**
 * email.ts - Email service for the CCAI API
 * Handles sending email campaigns through the Cloud Contact AI platform.
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI, Account } from '../ccai';

export type EmailAccount = Account & {
  email: string;
};

export type EmailCampaign = {
  subject: string;
  title: string;
  message: string;
  editor?: string | null;
  fileKey?: string | null;
  senderEmail: string;
  replyEmail: string;
  senderName: string;
  accounts: EmailAccount[];
  campaignType: "EMAIL";
  scheduledTimestamp?: string | null;
  scheduledTimezone?: string | null;
  addToList: string;
  selectedList?: { value: string | null };
  listId?: string | null;
  contactInput: string;
  replaceContacts?: boolean | null;
  emailTemplateId?: string | null;
  fluxId?: string | null;
  fromType: string;
  senders: any[];
};

export type EmailResponse = {
  // Define the expected response structure from the API
  id?: string;
  status?: string;
  campaignId?: string;
  messagesSent?: number;
  timestamp?: string;
  [key: string]: unknown;
};

export type EmailOptions = {
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

export class Email {
  private ccai: CCAI;
  private baseUrl: string = 'https://email-campaigns-test-cloudcontactai.allcode.com/api/v1';

  /**
   * Create a new Email service instance
   * @param ccai - The parent CCAI instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Make an authenticated API request to the email campaigns API with required headers
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request data
   * @returns Promise resolving to the API response
   */
  private async makeEmailRequest<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const axios = (await import('axios')).default;
      const response = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.ccai.getApiKey()}`,
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'clientId': this.ccai.getClientId(),
          'accountId': '1223' // This should be configurable in the future
        },
        data
      });
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        throw new Error(`API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      } else if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('No response received from API');
      } else {
        throw error;
      }
    }
  }

  /**
   * Send an email campaign to one or more recipients
   * @param campaign - The email campaign configuration
   * @param options - Optional settings for the email send operation
   * @returns Promise resolving to the API response
   */
  async sendCampaign(
    campaign: EmailCampaign,
    options?: EmailOptions
  ): Promise<EmailResponse> {
    // Validate inputs
    if (!campaign.accounts || !Array.isArray(campaign.accounts) || campaign.accounts.length === 0) {
      throw new Error('At least one account is required');
    }
    
    if (!campaign.subject) throw new Error('Subject is required');
    if (!campaign.title) throw new Error('Campaign title is required');
    if (!campaign.message) throw new Error('Message content is required');
    if (!campaign.senderEmail) throw new Error('Sender email is required');
    if (!campaign.replyEmail) throw new Error('Reply email is required');
    if (!campaign.senderName) throw new Error('Sender name is required');
    
    // Validate each account has the required fields
    campaign.accounts.forEach((account, index) => {
      if (!account.firstName) throw new Error(`First name is required for account at index ${index}`);
      if (!account.lastName) throw new Error(`Last name is required for account at index ${index}`);
      if (!account.email) throw new Error(`Email is required for account at index ${index}`);
    });
    
    // Notify progress if callback provided
    if (options?.onProgress) {
      options.onProgress('Preparing to send email campaign');
    }
    
    const endpoint = '/campaigns';
    
    try {
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('Sending email campaign');
      }
      
      // Make the API request to the email campaigns API with custom headers
      const response = await this.makeEmailRequest<EmailResponse>(
        'POST', 
        endpoint, 
        campaign
      );
      
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('Email campaign sent successfully');
      }
      
      return response;
    } catch (error) {
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('Email campaign sending failed');
      }
      
      throw error;
    }
  }

  /**
   * Send a single email to one recipient
   * @param firstName - Recipient's first name
   * @param lastName - Recipient's last name
   * @param email - Recipient's email address
   * @param subject - Email subject
   * @param message - The HTML message content
   * @param senderEmail - Sender's email address
   * @param replyEmail - Reply-to email address
   * @param senderName - Sender's name
   * @param title - Campaign title
   * @param options - Optional settings for the email send operation
   * @returns Promise resolving to the API response
   */
  async sendSingle(
    firstName: string,
    lastName: string,
    email: string,
    subject: string,
    message: string,
    senderEmail: string,
    replyEmail: string,
    senderName: string,
    title: string,
    options?: EmailOptions
  ): Promise<EmailResponse> {
    const account: EmailAccount = {
      firstName,
      lastName,
      email,
      phone: '' // Required by Account type but not used for email
    };
    
    const campaign: EmailCampaign = {
      subject,
      title,
      message,
      senderEmail,
      replyEmail,
      senderName,
      accounts: [account],
      campaignType: "EMAIL",
      addToList: "noList",
      contactInput: "accounts",
      fromType: "single",
      senders: []
    };
    
    return this.sendCampaign(campaign, options);
  }
}
