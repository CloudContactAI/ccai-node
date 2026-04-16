/**
 * mms.ts - MMS service for the CCAI API
 * Handles sending MMS messages through the Cloud Contact AI platform.
 *
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Account, CCAI } from '../ccai';
import { SMSOptions, SMSResponse } from './sms';

/**
 * Response from the signed URL API
 */
export type SignedUrlResponse = {
  /** The signed S3 URL for uploading the file */
  signedS3Url: string;
  /** The file key in S3 */
  fileKey: string;
  /** Additional data from the API */
  [key: string]: unknown;
};

/**
 * Response from the stored URL check API
 */
export type StoredUrlResponse = {
  /** The stored URL if the file exists, empty string otherwise */
  storedUrl: string;
  [key: string]: unknown;
};

/**
 * Service for sending multimedia messages through the CCAI API
 */
export class MMS {
  private ccai: CCAI;

  /**
   * Create a new MMS service instance
   * @param ccai - The parent CCAI instance
   */
  constructor(ccai: CCAI) {
    this.ccai = ccai;
  }

  /**
   * Get a signed S3 URL to upload an image file
   * @param fileName - Name of the file to upload
   * @param fileType - MIME type of the file (e.g., image/png, image/jpeg)
   * @param fileBasePath - Base path for the file in S3 (default: clientId/campaign)
   * @param publicFile - Whether the file should be public (default: true)
   * @returns Promise resolving to the signed URL response
   */
  async getSignedUploadUrl(
    fileName: string,
    fileType: string,
    fileBasePath?: string,
    publicFile = true
  ): Promise<SignedUrlResponse> {
    if (!fileName) throw new Error('File name is required');
    if (!fileType) throw new Error('File type is required');

    const basePath = fileBasePath ?? `${this.ccai.getClientId()}/campaign`;
    const fileKey = `${this.ccai.getClientId()}/campaign/${fileName}`;

    const data = {
      fileName,
      fileType,
      fileBasePath: basePath,
      publicFile,
    };

    try {
      const response = await axios.post(`${this.ccai.getFilesBaseUrl()}/upload/url`, data, {
        headers: {
          Authorization: `Bearer ${this.ccai.getApiKey()}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = response.data as SignedUrlResponse;

      if (!responseData.signedS3Url) {
        throw new Error('Invalid response from upload URL API');
      }

      responseData.fileKey = fileKey;

      return responseData;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get signed upload URL: ${error.message}`);
      }
      throw new Error('Failed to get signed upload URL');
    }
  }

  /**
   * Upload an image file to a signed S3 URL
   * @param signedUrl - The signed S3 URL to upload to
   * @param filePath - Path to the file to upload
   * @param contentType - MIME type of the file
   * @returns Promise resolving to true if upload was successful
   */
  async uploadImageToSignedUrl(
    signedUrl: string,
    filePath: string,
    contentType: string
  ): Promise<boolean> {
    if (!signedUrl) throw new Error('Signed URL is required');
    if (!filePath) throw new Error('File path is required');
    if (!contentType) throw new Error('Content type is required');

    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath);

      const response = await axios.put(signedUrl, fileContent, {
        headers: {
          'Content-Type': contentType,
        },
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Send an MMS message to one or more recipients
   * @param pictureFileKey - S3 file key for the image
   * @param accounts - Array of recipient objects
   * @param message - The message to send (supports ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param senderPhone - Optional sender phone number
   * @param options - Optional settings for timeout and progress tracking
   * @param forceNewCampaign - Whether to force a new campaign (default: true)
   * @returns Promise resolving to the API response
   */
  async send(
    pictureFileKey: string,
    accounts: Account[],
    message: string,
    title: string,
    senderPhone?: string,
    options?: SMSOptions,
    forceNewCampaign = true
  ): Promise<SMSResponse> {
    if (!pictureFileKey) throw new Error('Picture file key is required');
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('At least one account is required');
    }
    if (!message) throw new Error('Message is required');
    if (!title) throw new Error('Campaign title is required');

    accounts.forEach((account, index) => {
      if (!account.firstName)
        throw new Error(`First name is required for account at index ${index}`);
      if (!account.lastName) throw new Error(`Last name is required for account at index ${index}`);
      if (!account.phone) throw new Error(`Phone number is required for account at index ${index}`);
    });

    if (options?.onProgress) {
      options.onProgress('Preparing to send MMS');
    }

    const endpoint = `/clients/${this.ccai.getClientId()}/campaigns/direct`;

    // Map customData → messageData (API wire format)
    const mappedAccounts = accounts.map(({ data, customData, ...rest }) => ({
      ...rest,
      ...(data !== undefined ? { data } : {}),
      ...(customData !== undefined ? { messageData: customData } : {}),
    }));

    const campaignData: Record<string, unknown> = {
      pictureFileKey,
      accounts: mappedAccounts,
      message,
      title,
    };
    if (senderPhone) {
      campaignData.senderPhone = senderPhone;
    }

    try {
      if (options?.onProgress) {
        options.onProgress('Sending MMS');
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.ccai.getApiKey()}`,
        'Content-Type': 'application/json',
      };

      if (forceNewCampaign) {
        headers.ForceNewCampaign = 'true';
      }

      const url = `${this.ccai.getBaseUrl()}${endpoint}`;
      const axiosConfig: Record<string, unknown> = { headers };
      if (options?.timeout) {
        axiosConfig.timeout = options.timeout;
      }
      const response = await axios.post(url, campaignData, axiosConfig);

      if (options?.onProgress) {
        options.onProgress('MMS sent successfully');
      }

      return response.data;
    } catch (error) {
      if (options?.onProgress) {
        options.onProgress('MMS sending failed');
      }

      if (error instanceof Error) {
        throw new Error(`Failed to send MMS: ${error.message}`);
      }
      throw new Error('Failed to send MMS');
    }
  }

  /**
   * Send a single MMS message to one recipient
   * @param pictureFileKey - S3 file key for the image
   * @param firstName - Recipient's first name
   * @param lastName - Recipient's last name
   * @param phone - Recipient's phone number (E.164 format)
   * @param message - The message to send
   * @param title - Campaign title
   * @param customData - Optional arbitrary string forwarded to your webhook handler (sent as messageData)
   * @param senderPhone - Optional sender phone number
   * @param options - Optional settings
   * @param forceNewCampaign - Whether to force a new campaign (default: true)
   * @returns Promise resolving to the API response
   */
  async sendSingle(
    pictureFileKey: string,
    firstName: string,
    lastName: string,
    phone: string,
    message: string,
    title: string,
    customData?: string,
    senderPhone?: string,
    options?: SMSOptions,
    forceNewCampaign = true
  ): Promise<SMSResponse> {
    const account: Account = {
      firstName,
      lastName,
      phone,
      ...(customData !== undefined ? { customData } : {}),
    };

    return this.send(
      pictureFileKey,
      [account],
      message,
      title,
      senderPhone,
      options,
      forceNewCampaign
    );
  }

  /**
   * Complete MMS workflow: check cache, optionally upload, and send MMS.
   * Automatically computes MD5 of the image file to avoid re-uploading identical images.
   * @param imagePath - Path to the image file
   * @param contentType - MIME type of the image
   * @param accounts - Array of recipient objects
   * @param message - The message to send
   * @param title - Campaign title
   * @param senderPhone - Optional sender phone number
   * @param options - Optional settings
   * @param forceNewCampaign - Whether to force a new campaign (default: true)
   * @returns Promise resolving to the API response
   */
  async sendWithImage(
    imagePath: string,
    contentType: string,
    accounts: Account[],
    message: string,
    title: string,
    senderPhone?: string,
    options?: SMSOptions,
    forceNewCampaign = true
  ): Promise<SMSResponse> {
    const opts = options || {};

    // Step 1: Compute MD5 of the image file for caching
    const md5Hash = await this.md5File(imagePath);
    const extension = path.extname(imagePath).replace('.', '').toLowerCase();
    const fileName = `${md5Hash}.${extension}`;
    const fileKey = `${this.ccai.getClientId()}/campaign/${fileName}`;

    // Step 2: Check if the same image has already been uploaded
    if (opts.onProgress) {
      opts.onProgress('Checking if image already uploaded');
    }

    const storedUrlResponse = await this.checkFileUploaded(fileKey);

    if (storedUrlResponse?.storedUrl) {
      // Image already uploaded, skip upload and send directly
      if (opts.onProgress) {
        opts.onProgress('Image already exists in S3, sending MMS');
      }
      return this.send(fileKey, accounts, message, title, senderPhone, opts, forceNewCampaign);
    }

    // Step 3: Get a signed URL for uploading
    if (opts.onProgress) {
      opts.onProgress('Getting signed upload URL');
    }
    const uploadResponse = await this.getSignedUploadUrl(fileName, contentType);
    const signedUrl = uploadResponse.signedS3Url;

    // Step 4: Upload the image to the signed URL
    if (opts.onProgress) {
      opts.onProgress('Uploading image to S3');
    }
    const uploadSuccess = await this.uploadImageToSignedUrl(signedUrl, imagePath, contentType);

    if (!uploadSuccess) {
      throw new Error('Failed to upload image to S3');
    }

    // Step 5: Send the MMS with the uploaded image
    if (opts.onProgress) {
      opts.onProgress('Image uploaded successfully, sending MMS');
    }
    return this.send(fileKey, accounts, message, title, senderPhone, opts, forceNewCampaign);
  }

  /**
   * Check if a file has already been uploaded to S3
   * @param fileKey - The S3 file key to check
   * @returns Promise resolving to the stored URL response, or empty storedUrl on error
   */
  async checkFileUploaded(fileKey: string): Promise<StoredUrlResponse | null> {
    try {
      const response = await this.ccai.request<StoredUrlResponse>(
        'GET',
        `/clients/${this.ccai.getClientId()}/storedUrl?fileKey=${fileKey}`
      );
      return response;
    } catch {
      return { storedUrl: '' } as StoredUrlResponse;
    }
  }

  /**
   * Calculate the MD5 hash of a file
   * @param filePath - Path to the file
   * @returns Promise resolving to the MD5 hash in hexadecimal format
   */
  private async md5File(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}
