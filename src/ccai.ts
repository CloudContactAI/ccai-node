/**
 * ccai.ts - A TypeScript module for interacting with the Cloud Contact AI API
 * This module provides functionality to send SMS messages and email campaigns through the CCAI platform.
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import axios, { AxiosResponse } from 'axios';
import { SMS } from './sms/sms';
import { MMS } from './sms/mms';
import { Email } from './email/email';
import { Webhook } from './webhook/webhook';

// Define types for type safety
export type Account = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type CCAIConfig = {
  clientId: string;
  apiKey: string;
  baseUrl?: string;
};

export class CCAI {
  private clientId: string;
  private apiKey: string;
  private baseUrl: string;
  public sms: SMS;
  public mms: MMS;
  public email: Email;
  public webhook: Webhook;

  /**
   * Create a new CCAI client instance
   * @param config - Configuration object containing clientId and apiKey
   */
  constructor(config: CCAIConfig) {
    if (!config.clientId) throw new Error('Client ID is required');
    if (!config.apiKey) throw new Error('API Key is required');
    
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://core.cloudcontactai.com/api';
    
    // Initialize the services
    this.sms = new SMS(this);
    this.mms = new MMS(this);
    this.email = new Email(this);
    this.webhook = new Webhook(this);
  }

  /**
   * Get the client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Make an authenticated API request to the CCAI API
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request data
   * @returns Promise resolving to the API response
   */
  async request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
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
   * Make an authenticated API request to a custom API endpoint
   * @param method - HTTP method
   * @param endpoint - API endpoint
   * @param data - Request data
   * @param customBaseUrl - Custom base URL for the API
   * @returns Promise resolving to the API response
   */
  async customRequest<T>(method: string, endpoint: string, data?: unknown, customBaseUrl?: string): Promise<T> {
    const url = `${customBaseUrl || this.baseUrl}${endpoint}`;
    
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
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
}
