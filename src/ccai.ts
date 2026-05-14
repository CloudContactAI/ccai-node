/**
 * ccai.ts - A TypeScript module for interacting with the Cloud Contact AI API
 * This module provides functionality to send SMS, MMS, and Email messages,
 * manage webhooks, and handle contact preferences through the CCAI platform.
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import axios, { AxiosResponse } from 'axios';
import { Brands } from './brands/brands';
import { Campaigns } from './campaigns/campaigns';
import { ContactValidator } from './contact-validator/contact-validator';
import { Contact } from './contact/contact';
import { Email } from './email/email';
import { MMS } from './sms/mms';
import { SMS } from './sms/sms';
import { Webhook } from './webhook/webhook';

// Production URLs
const PROD_BASE_URL = 'https://core.cloudcontactai.com/api';
const PROD_EMAIL_URL = 'https://email-campaigns.cloudcontactai.com/api/v1';
const PROD_FILES_URL = 'https://files.cloudcontactai.com';
const PROD_COMPLIANCE_URL = 'https://compliance.cloudcontactai.com/api';

// Test environment URLs
const TEST_BASE_URL = 'https://core-test-cloudcontactai.allcode.com/api';
const TEST_EMAIL_URL = 'https://email-campaigns-test-cloudcontactai.allcode.com/api/v1';
const TEST_FILES_URL = 'https://files-test-cloudcontactai.allcode.com';
const TEST_COMPLIANCE_URL = 'https://compliance-test-cloudcontactai.allcode.com/api';

/**
 * Account representing a message recipient.
 *
 * Base fields always available as template variables in messages:
 *   ${firstName}, ${lastName}, ${phone}, ${email}
 */
export type Account = {
  firstName: string;
  lastName: string;
  phone: string;
  /**
   * Additional key-value pairs for variable substitution in message templates.
   * Define any keys you want and use them as ${key} in your message.
   *
   * Example:
   *   data: { city: "Miami", country: "USA" }
   *   message: "Hello ${firstName}, greetings from ${city}, ${country}!"
   *
   * CloudContact substitutes all matching variables automatically.
   */
  data?: Record<string, string>;
  /**
   * Arbitrary string payload forwarded as-is to your webhook handler.
   * Not used in the message body — useful for passing context (e.g. order ID, session data)
   * that your system needs when processing the webhook event.
   *
   * Example: '{"orderId":"ORD-123","source":"checkout"}'
   *
   * Note: sent to the API as `messageData` (wire format) — the SDK handles the mapping.
   */
  customData?: string;
};

/**
 * Configuration options for the CCAI client
 */
export type CCAIConfig = {
  /** Client ID for authentication */
  clientId: string;
  /** API key for authentication */
  apiKey: string;
  /** Whether to use test environment URLs (default: false) */
  useTestEnvironment?: boolean;
  /** Override base URL for the core API */
  baseUrl?: string;
  /** Override base URL for the Email API */
  emailBaseUrl?: string;
  /** Override base URL for the Files API */
  filesBaseUrl?: string;
  /** Override base URL for the Compliance API */
  complianceBaseUrl?: string;
};

/**
 * Main client for interacting with the CloudContactAI API
 */
export class CCAI {
  private clientId: string;
  private apiKey: string;
  private baseUrl: string;
  private emailBaseUrl: string;
  private filesBaseUrl: string;
  private complianceBaseUrl: string;
  private useTestEnvironment: boolean;

  /** SMS service for sending text messages */
  public sms: SMS;

  /** MMS service for sending multimedia messages */
  public mms: MMS;

  /** Email service for sending email campaigns */
  public email: Email;

  /** Webhook service for managing webhook endpoints */
  public webhook: Webhook;
  public brands: Brands;
  public campaigns: Campaigns;

  /** Contact service for managing contact preferences */
  public contact: Contact;

  /** Contact validator service for validating emails and phone numbers */
  public contactValidator: ContactValidator;

  /**
   * Create a new CCAI client instance
   * @param config - Configuration object
   */
  constructor(config: CCAIConfig) {
    if (!config.clientId) throw new Error('Client ID is required');
    if (!config.apiKey) throw new Error('API Key is required');

    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.useTestEnvironment = config.useTestEnvironment ?? false;

    // Resolve URLs: explicit override > env var > test/prod default
    this.baseUrl = this.resolveUrl(
      config.baseUrl,
      process.env.CCAI_BASE_URL,
      PROD_BASE_URL,
      TEST_BASE_URL
    );

    this.emailBaseUrl = this.resolveUrl(
      config.emailBaseUrl,
      process.env.CCAI_EMAIL_BASE_URL,
      PROD_EMAIL_URL,
      TEST_EMAIL_URL
    );

    this.filesBaseUrl = this.resolveUrl(
      config.filesBaseUrl,
      process.env.CCAI_FILES_BASE_URL,
      PROD_FILES_URL,
      TEST_FILES_URL
    );

    this.complianceBaseUrl = this.resolveUrl(
      config.complianceBaseUrl,
      process.env.CCAI_COMPLIANCE_BASE_URL,
      PROD_COMPLIANCE_URL,
      TEST_COMPLIANCE_URL
    );

    // Initialize the services
    this.sms = new SMS(this);
    this.mms = new MMS(this);
    this.email = new Email(this);
    this.webhook = new Webhook(this);
    this.contact = new Contact(this);
    this.brands = new Brands(this);
    this.campaigns = new Campaigns(this);
    this.contactValidator = new ContactValidator(this);
  }

  /**
   * Resolve URL with priority: explicit > env > prod/test default
   */
  private resolveUrl(
    explicit: string | undefined,
    envVar: string | undefined,
    prodDefault: string,
    testDefault: string
  ): string {
    if (explicit) return explicit;
    if (envVar) return envVar;
    return this.useTestEnvironment ? testDefault : prodDefault;
  }

  /**
   * Get the client ID
   * @returns The client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get the API key
   * @returns The API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the base URL for the core API
   * @returns The base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the base URL for the Email API
   * @returns The email base URL
   */
  getEmailBaseUrl(): string {
    return this.emailBaseUrl;
  }

  /**
   * Get the base URL for the Files API
   * @returns The files base URL
   */
  getFilesBaseUrl(): string {
    return this.filesBaseUrl;
  }

  /**
   * Get the base URL for the Compliance API
   * @returns The compliance base URL
   */
  getComplianceBaseUrl(): string {
    return this.complianceBaseUrl;
  }

  /**
   * Whether the test environment is active
   * @returns True if using test environment
   */
  isTestEnvironment(): boolean {
    return this.useTestEnvironment;
  }

  /**
   * Make an authenticated API request to the CCAI API
   * @param method - HTTP method (get, post, put, delete)
   * @param endpoint - API endpoint (relative to base URL)
   * @param data - Request body data
   * @returns Promise resolving to the API response
   */
  async request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        data,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        throw new Error(
          `API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
        );
      }
      if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('No response received from API');
      }
      throw error;
    }
  }

  /**
   * Make an authenticated API request to a custom API endpoint
   * @param method - HTTP method (get, post, put, delete)
   * @param endpoint - API endpoint (relative to custom base URL)
   * @param data - Request body data
   * @param customBaseUrl - Custom base URL (defaults to core base URL)
   * @param extraHeaders - Additional headers to merge with defaults
   * @returns Promise resolving to the API response
   */
  async customRequest<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    customBaseUrl?: string,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${customBaseUrl || this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: '*/*',
      ...extraHeaders,
    };

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers,
        data,
      });

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data: unknown } };
        throw new Error(
          `API Error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
        );
      }
      if (error && typeof error === 'object' && 'request' in error) {
        throw new Error('No response received from API');
      }
      throw error;
    }
  }
}
