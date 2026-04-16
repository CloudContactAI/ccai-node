/**
 * email.ts - Email service for the CCAI API
 * Handles sending email campaigns through the Cloud Contact AI platform.
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { Account, CCAI } from '../ccai';

/**
 * Email recipient account
 */
export type EmailAccount = Account & {
  email: string;
  customAccountId?: string;
};

/**
 * Email campaign configuration
 */
export type EmailCampaign = {
  subject: string;
  title: string;
  message: string;
  textContent?: string | null;
  editor?: string | null;
  fileKey?: string | null;
  senderEmail: string;
  replyEmail: string;
  senderName: string;
  accounts: EmailAccount[];
  campaignType: 'EMAIL';
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
  senders: Record<string, unknown>[];
};

/**
 * Email API response
 */
export type EmailResponse = {
  id?: string;
  status?: string;
  campaignId?: string;
  message?: string;
  responseId?: string;
  messagesSent?: number;
  timestamp?: string;
  [key: string]: unknown;
};

/**
 * Optional settings for email operations
 */
export type EmailOptions = {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry count for failed requests */
  retries?: number;
  /** Callback for tracking progress */
  onProgress?: (status: string) => void;
};

/**
 * Service for sending email campaigns through the CCAI API
 */
export class Email {
  private ccai: CCAI;

  /**
   * Create a new Email service instance
   * @param ccai - The parent CCAI instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Make an authenticated API request to the email campaigns API
   * Uses the email base URL with AccountId and ClientId headers
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @returns Promise resolving to the API response
   */
  private async makeEmailRequest<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    return this.ccai.customRequest<T>(method, endpoint, data, this.ccai.getEmailBaseUrl(), {
      AccountId: this.ccai.getClientId(),
      ClientId: this.ccai.getClientId(),
    });
  }

  /**
   * Send an email campaign to one or more recipients
   * @param accounts - Array of recipient accounts
   * @param subject - Email subject line
   * @param message - The HTML message content
   * @param senderEmail - Sender's email address
   * @param replyEmail - Reply-to email address
   * @param senderName - Sender's display name
   * @param title - Campaign title (defaults to subject)
   * @param options - Optional settings for progress tracking
   * @returns Promise resolving to the API response
   */
  async send(
    accounts: EmailAccount[],
    subject: string,
    message: string,
    senderEmail: string,
    replyEmail: string,
    senderName: string,
    title?: string,
    options?: EmailOptions
  ): Promise<EmailResponse> {
    const campaignTitle = title || subject;

    const campaign: EmailCampaign = {
      subject,
      title: campaignTitle,
      message,
      senderEmail,
      replyEmail,
      senderName,
      accounts,
      campaignType: 'EMAIL',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: [],
    };

    return this.sendCampaign(campaign, options);
  }

  /**
   * Send an email campaign with full campaign configuration
   * @param campaign - The complete email campaign configuration
   * @param options - Optional settings for progress tracking
   * @returns Promise resolving to the API response
   */
  async sendCampaign(campaign: EmailCampaign, options?: EmailOptions): Promise<EmailResponse> {
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
      if (!account.firstName)
        throw new Error(`First name is required for account at index ${index}`);
      if (!account.lastName) throw new Error(`Last name is required for account at index ${index}`);
      if (!account.email) throw new Error(`Email is required for account at index ${index}`);
    });

    // Notify progress if callback provided
    if (options?.onProgress) {
      options.onProgress('Preparing to send email campaign');
    }

    const endpoint = '/campaigns';

    // Map customData → messageData (API wire format)
    const mappedAccounts = campaign.accounts.map(({ data, customData, ...rest }) => ({
      ...rest,
      ...(data !== undefined ? { data } : {}),
      ...(customData !== undefined ? { messageData: customData } : {}),
    }));

    const payload = { ...campaign, accounts: mappedAccounts };

    try {
      if (options?.onProgress) {
        options.onProgress('Sending email campaign');
      }

      const response = await this.makeEmailRequest<EmailResponse>('POST', endpoint, payload);

      if (options?.onProgress) {
        options.onProgress('Email campaign sent successfully');
      }

      return response;
    } catch (error) {
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
   * @param subject - Email subject line
   * @param message - The HTML message content
   * @param senderEmail - Sender's email address
   * @param replyEmail - Reply-to email address
   * @param senderName - Sender's display name
   * @param title - Campaign title
   * @param options - Optional settings for progress tracking
   * @returns Promise resolving to the API response
   */
  async sendSingle(
    firstName: string,
    lastName: string,
    email: string,
    subject: string,
    message: string,
    textContent?: string,
    senderEmail = 'noreply@cloudcontactai.com',
    replyEmail = 'noreply@cloudcontactai.com',
    senderName = 'CloudContactAI',
    title: string = subject,
    options?: EmailOptions
  ): Promise<EmailResponse> {
    const account: EmailAccount = {
      firstName,
      lastName,
      email,
      phone: '', // Required by Account type but not used for email
    };

    const campaign: EmailCampaign = {
      subject,
      title: title || subject,
      message,
      ...(textContent ? { textContent } : {}),
      senderEmail,
      replyEmail,
      senderName,
      accounts: [account],
      campaignType: 'EMAIL',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: [],
    };

    return this.sendCampaign(campaign, options);
  }
}
