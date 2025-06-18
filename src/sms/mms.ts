/**
 * mms.ts - MMS service for the CCAI API
 * Handles sending MMS messages through the Cloud Contact AI platform.
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { CCAI, Account } from '../ccai';
import { SMSOptions, SMSResponse } from './sms';

export type SignedUrlResponse = {
  /**
   * The signed S3 URL for uploading the file
   */
  signedS3Url: string;
  
  /**
   * The file key in S3
   */
  fileKey: string;
  
  /**
   * Additional data from the API
   */
  [key: string]: unknown;
};

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
   * @param fileType - MIME type of the file
   * @param fileBasePath - Base path for the file in S3 (default: clientId/campaign)
   * @param publicFile - Whether the file should be public (default: true)
   * @returns Promise resolving to the signed URL response
   */
  async getSignedUploadUrl(
    fileName: string,
    fileType: string,
    fileBasePath?: string,
    publicFile: boolean = true
  ): Promise<SignedUrlResponse> {
    if (!fileName) throw new Error('File name is required');
    if (!fileType) throw new Error('File type is required');
    
    // Use default fileBasePath if not provided
    fileBasePath = fileBasePath ?? `${this.ccai.getClientId()}/campaign`;
    
    // Define fileKey explicitly as clientId/campaign/filename
    const fileKey = `${this.ccai.getClientId()}/campaign/${fileName}`;
    
    const data = {
      fileName,
      fileType,
      fileBasePath,
      publicFile
    };
    
    try {
      const response = await axios.post(
        'https://files.cloudcontactai.com/upload/url',
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.ccai.getApiKey()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const responseData = response.data;
      
      if (!responseData.signedS3Url) {
        throw new Error('Invalid response from upload URL API');
      }
      
      // Override the fileKey with our explicitly defined one
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
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      // Read file content
      const fileContent = fs.readFileSync(filePath);
      
      // Upload file to S3
      const response = await axios.put(
        signedUrl,
        fileContent,
        {
          headers: {
            'Content-Type': contentType
          }
        }
      );
      
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
   * @param message - The message to send (can include ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param options - Optional settings for the MMS send operation
   * @param forceNewCampaign - Whether to force a new campaign (default: true)
   * @returns Promise resolving to the API response
   */
  async send(
    pictureFileKey: string,
    accounts: Account[],
    message: string,
    title: string,
    options?: SMSOptions,
    forceNewCampaign: boolean = true
  ): Promise<SMSResponse> {
    // Validate inputs
    if (!pictureFileKey) throw new Error('Picture file key is required');
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
      options.onProgress('Preparing to send MMS');
    }
    
    const endpoint = `/clients/${this.ccai.getClientId()}/campaigns/direct`;
    
    const campaignData = {
      pictureFileKey,
      accounts,
      message,
      title
    };
    
    try {
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('Sending MMS');
      }
      
      // Set up headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.ccai.getApiKey()}`,
        'Content-Type': 'application/json'
      };
      
      if (forceNewCampaign) {
        headers['ForceNewCampaign'] = 'true';
      }
      
      // Make the API request
      const url = `${this.ccai.getBaseUrl()}${endpoint}`;
      const response = await axios.post(url, campaignData, {
        headers,
        timeout: options?.timeout
      });
      
      // Notify progress if callback provided
      if (options?.onProgress) {
        options.onProgress('MMS sent successfully');
      }
      
      return response.data;
    } catch (error) {
      // Notify progress if callback provided
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
   * @param message - The message to send (can include ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param options - Optional settings for the MMS send operation
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
    options?: SMSOptions,
    forceNewCampaign: boolean = true
  ): Promise<SMSResponse> {
    const account: Account = {
      firstName,
      lastName,
      phone
    };
    
    return this.send(
      pictureFileKey,
      [account],
      message,
      title,
      options,
      forceNewCampaign
    );
  }

  /**
   * Complete MMS workflow: get signed URL, upload image, and send MMS
   * @param imagePath - Path to the image file
   * @param contentType - MIME type of the image
   * @param accounts - Array of recipient objects
   * @param message - The message to send (can include ${firstName} and ${lastName} variables)
   * @param title - Campaign title
   * @param options - Optional settings for the MMS send operation
   * @param forceNewCampaign - Whether to force a new campaign (default: true)
   * @returns Promise resolving to the API response
   */
  async sendWithImage(
    imagePath: string,
    contentType: string,
    accounts: Account[],
    message: string,
    title: string,
    options?: SMSOptions,
    forceNewCampaign: boolean = true
  ): Promise<SMSResponse> {
    // Create options if not provided
    options = options || {};
    
    // Step 1: Get the file name from the path
    const fileName = path.basename(imagePath);
    
    // Notify progress if callback provided
    if (options.onProgress) {
      options.onProgress('Getting signed upload URL');
    }
    
    // Step 2: Get a signed URL for uploading
    const uploadResponse = await this.getSignedUploadUrl(fileName, contentType);
    const signedUrl = uploadResponse.signedS3Url;
    const fileKey = uploadResponse.fileKey;
    
    // Notify progress if callback provided
    if (options.onProgress) {
      options.onProgress('Uploading image to S3');
    }
    
    // Step 3: Upload the image to the signed URL
    const uploadSuccess = await this.uploadImageToSignedUrl(signedUrl, imagePath, contentType);
    
    if (!uploadSuccess) {
      throw new Error('Failed to upload image to S3');
    }
    
    // Notify progress if callback provided
    if (options.onProgress) {
      options.onProgress('Image uploaded successfully, sending MMS');
    }
    
    // Step 4: Send the MMS with the uploaded image
    return this.send(
      fileKey,
      accounts,
      message,
      title,
      options,
      forceNewCampaign
    );
  }
}
