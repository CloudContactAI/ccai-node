/**
 * Tests for the MMS class
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { CCAI } from '../../ccai';
import { MMS } from '../../sms/mms';
import { SMSOptions } from '../../sms/sms';
import { Account } from '../../ccai';

// Mock dependencies
jest.mock('axios');
jest.mock('fs');
jest.mock('path');

describe('MMS', () => {
  // Create mocks
  const mockCcai = {
    getClientId: jest.fn().mockReturnValue('test-client-id'),
    getApiKey: jest.fn().mockReturnValue('test-api-key'),
    getBaseUrl: jest.fn().mockReturnValue('https://test-api.com'),
    request: jest.fn()
  };
  
  // Cast the mock to CCAI type
  const ccai = mockCcai as unknown as CCAI;
  
  // Test data
  const validAccounts: Account[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567'
    }
  ];
  
  const message = 'Hello ${firstName}!';
  const title = 'Test MMS Campaign';
  const pictureFileKey = 'test-client-id/campaign/test-image.jpg';
  const fileName = 'test-image.jpg';
  const filePath = '/path/to/test-image.jpg';
  const contentType = 'image/jpeg';
  const signedUrl = 'https://s3.amazonaws.com/bucket/signed-url';
  
  let mms: MMS;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new MMS instance for each test
    mms = new MMS(ccai);
    
    // Mock path.basename
    (path.basename as jest.Mock).mockReturnValue(fileName);
    
    // Mock fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test image data'));
  });
  
  describe('getSignedUploadUrl', () => {
    it('should get a signed upload URL successfully', async () => {
      const mockResponse = {
        data: {
          signedS3Url: signedUrl,
          fileKey: 'original/file/key'
        }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await mms.getSignedUploadUrl(fileName, contentType);
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://files.cloudcontactai.com/upload/url',
        {
          fileName,
          fileType: contentType,
          fileBasePath: 'test-client-id/campaign',
          publicFile: true
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        }
      );
      
      expect(result).toEqual({
        signedS3Url: signedUrl,
        fileKey: 'test-client-id/campaign/test-image.jpg'
      });
    });
    
    it('should throw an error if fileName is missing', async () => {
      await expect(mms.getSignedUploadUrl('', contentType))
        .rejects
        .toThrow('File name is required');
    });
    
    it('should throw an error if fileType is missing', async () => {
      await expect(mms.getSignedUploadUrl(fileName, ''))
        .rejects
        .toThrow('File type is required');
    });
    
    it('should throw an error if API response is invalid', async () => {
      const mockResponse = {
        data: { /* missing signedS3Url */ }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      await expect(mms.getSignedUploadUrl(fileName, contentType))
        .rejects
        .toThrow('Invalid response from upload URL API');
    });
    
    it('should handle API errors', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      await expect(mms.getSignedUploadUrl(fileName, contentType))
        .rejects
        .toThrow('Failed to get signed upload URL: API Error');
    });
  });
  
  describe('uploadImageToSignedUrl', () => {
    it('should upload an image successfully', async () => {
      const mockResponse = {
        status: 200
      };
      
      (axios.put as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await mms.uploadImageToSignedUrl(signedUrl, filePath, contentType);
      
      expect(fs.existsSync).toHaveBeenCalledWith(filePath);
      expect(fs.readFileSync).toHaveBeenCalledWith(filePath);
      
      expect(axios.put).toHaveBeenCalledWith(
        signedUrl,
        expect.any(Buffer),
        {
          headers: {
            'Content-Type': contentType
          }
        }
      );
      
      expect(result).toBe(true);
    });
    
    it('should throw an error if signedUrl is missing', async () => {
      await expect(mms.uploadImageToSignedUrl('', filePath, contentType))
        .rejects
        .toThrow('Signed URL is required');
    });
    
    it('should throw an error if filePath is missing', async () => {
      await expect(mms.uploadImageToSignedUrl(signedUrl, '', contentType))
        .rejects
        .toThrow('File path is required');
    });
    
    it('should throw an error if contentType is missing', async () => {
      await expect(mms.uploadImageToSignedUrl(signedUrl, filePath, ''))
        .rejects
        .toThrow('Content type is required');
    });
    
    it('should throw an error if file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      
      await expect(mms.uploadImageToSignedUrl(signedUrl, filePath, contentType))
        .rejects
        .toThrow(`File does not exist: ${filePath}`);
    });
    
    it('should handle upload errors', async () => {
      (axios.put as jest.Mock).mockRejectedValueOnce(new Error('Upload Error'));
      
      await expect(mms.uploadImageToSignedUrl(signedUrl, filePath, contentType))
        .rejects
        .toThrow('Failed to upload file: Upload Error');
    });
  });
  
  describe('send', () => {
    it('should send an MMS campaign successfully', async () => {
      const mockResponse = {
        data: {
          id: '123',
          status: 'success',
          campaignId: 'camp-456',
          messagesSent: 1
        }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await mms.send(pictureFileKey, validAccounts, message, title);
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-api.com/clients/test-client-id/campaigns/direct',
        {
          pictureFileKey,
          accounts: validAccounts,
          message,
          title
        },
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'ForceNewCampaign': 'true'
          },
          timeout: undefined
        }
      );
      
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw an error if pictureFileKey is missing', async () => {
      await expect(mms.send('', validAccounts, message, title))
        .rejects
        .toThrow('Picture file key is required');
    });
    
    it('should throw an error if accounts array is empty', async () => {
      await expect(mms.send(pictureFileKey, [], message, title))
        .rejects
        .toThrow('At least one account is required');
    });
    
    it('should throw an error if message is missing', async () => {
      await expect(mms.send(pictureFileKey, validAccounts, '', title))
        .rejects
        .toThrow('Message is required');
    });
    
    it('should throw an error if title is missing', async () => {
      await expect(mms.send(pictureFileKey, validAccounts, message, ''))
        .rejects
        .toThrow('Campaign title is required');
    });
    
    it('should validate account fields', async () => {
      const invalidAccounts = [
        { lastName: 'Doe', phone: '+15551234567' } // Missing firstName
      ];
      
      await expect(mms.send(pictureFileKey, invalidAccounts as any, message, title))
        .rejects
        .toThrow('First name is required for account at index 0');
    });
    
    it('should call progress callback if provided', async () => {
      const mockResponse = {
        data: { id: '123', status: 'success' }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const onProgress = jest.fn();
      const options: SMSOptions = { onProgress };
      
      await mms.send(pictureFileKey, validAccounts, message, title, options);
      
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 'Preparing to send MMS');
      expect(onProgress).toHaveBeenNthCalledWith(2, 'Sending MMS');
    });
    
    it('should call progress callback on error', async () => {
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      const onProgress = jest.fn();
      const options: SMSOptions = { onProgress };
      
      await expect(mms.send(pictureFileKey, validAccounts, message, title, options))
        .rejects
        .toThrow('Failed to send MMS: API Error');
      
      expect(onProgress).toHaveBeenCalledWith('MMS sending failed');
    });
    
    it('should respect forceNewCampaign parameter', async () => {
      const mockResponse = {
        data: { id: '123', status: 'success' }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      await mms.send(pictureFileKey, validAccounts, message, title, undefined, false);
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-api.com/clients/test-client-id/campaigns/direct',
        expect.any(Object),
        {
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
            // ForceNewCampaign header should not be present
          },
          timeout: undefined
        }
      );
    });
  });
  
  describe('sendSingle', () => {
    it('should send a single MMS message', async () => {
      const mockResponse = {
        data: { id: '123', status: 'success' }
      };
      
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const result = await mms.sendSingle(
        pictureFileKey,
        'Jane',
        'Smith',
        '+15559876543',
        'Hi ${firstName}!',
        'Single MMS Test'
      );
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-api.com/clients/test-client-id/campaigns/direct',
        {
          pictureFileKey,
          accounts: [
            {
              firstName: 'Jane',
              lastName: 'Smith',
              phone: '+15559876543'
            }
          ],
          message: 'Hi ${firstName}!',
          title: 'Single MMS Test'
        },
        expect.any(Object)
      );
      
      expect(result).toEqual(mockResponse.data);
    });
  });
  
  describe('sendWithImage', () => {
    it('should complete the full MMS workflow', async () => {
      // Mock getSignedUploadUrl response
      const uploadUrlResponse = {
        signedS3Url: signedUrl,
        fileKey: pictureFileKey
      };
      
      // Mock uploadImageToSignedUrl response
      const uploadSuccess = true;
      
      // Mock send response
      const sendResponse = {
        id: '123',
        status: 'success',
        campaignId: 'camp-456'
      };
      
      // Setup spies
      const getSignedUploadUrlSpy = jest.spyOn(mms, 'getSignedUploadUrl')
        .mockResolvedValueOnce(uploadUrlResponse);
      
      const uploadImageToSignedUrlSpy = jest.spyOn(mms, 'uploadImageToSignedUrl')
        .mockResolvedValueOnce(uploadSuccess);
      
      const sendSpy = jest.spyOn(mms, 'send')
        .mockResolvedValueOnce(sendResponse);
      
      // Execute the workflow
      const onProgress = jest.fn();
      const options: SMSOptions = { onProgress };
      
      const result = await mms.sendWithImage(
        filePath,
        contentType,
        validAccounts,
        message,
        title,
        options
      );
      
      // Verify the workflow steps
      expect(path.basename).toHaveBeenCalledWith(filePath);
      
      expect(getSignedUploadUrlSpy).toHaveBeenCalledWith(
        fileName,
        contentType
      );
      
      expect(uploadImageToSignedUrlSpy).toHaveBeenCalledWith(
        signedUrl,
        filePath,
        contentType
      );
      
      expect(sendSpy).toHaveBeenCalledWith(
        pictureFileKey,
        validAccounts,
        message,
        title,
        options,
        true
      );
      
      // Verify progress callbacks
      expect(onProgress).toHaveBeenCalledWith('Getting signed upload URL');
      expect(onProgress).toHaveBeenCalledWith('Uploading image to S3');
      expect(onProgress).toHaveBeenCalledWith('Image uploaded successfully, sending MMS');
      
      // Verify result
      expect(result).toEqual(sendResponse);
    });
    
    it('should throw an error if upload fails', async () => {
      // Mock getSignedUploadUrl response
      const uploadUrlResponse = {
        signedS3Url: signedUrl,
        fileKey: pictureFileKey
      };
      
      // Mock uploadImageToSignedUrl to fail
      const uploadSuccess = false;
      
      // Setup spies
      jest.spyOn(mms, 'getSignedUploadUrl')
        .mockResolvedValueOnce(uploadUrlResponse);
      
      jest.spyOn(mms, 'uploadImageToSignedUrl')
        .mockResolvedValueOnce(uploadSuccess);
      
      // Execute the workflow
      await expect(mms.sendWithImage(
        filePath,
        contentType,
        validAccounts,
        message,
        title
      )).rejects.toThrow('Failed to upload image to S3');
    });
  });
});
