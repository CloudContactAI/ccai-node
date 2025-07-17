/**
 * Tests for the SMS class
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import { CCAI, Account } from '../../ccai';
import { SMS, SMSOptions } from '../../sms/sms';

describe('SMS', () => {
  let ccai: CCAI;
  let sms: SMS;
  
  // Mock the request method
  const mockRequest = jest.fn();
  
  beforeEach(() => {
    // Create a real CCAI instance
    ccai = new CCAI({
      clientId: 'test-client-id',
      apiKey: 'test-api-key'
    });
    
    // Mock the request method
    ccai.request = mockRequest;
    
    sms = new SMS(ccai);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test data
  const validAccounts: Account[] = [
    {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567'
    }
  ];
  
  const message = 'Hello ${firstName}!';
  const title = 'Test Campaign';
  
  describe('send', () => {
    it('should send an SMS campaign successfully', async () => {
      const mockResponse = { id: '123', status: 'success' };
      mockRequest.mockResolvedValueOnce(mockResponse);
      
      const result = await sms.send(validAccounts, message, title);
      
      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/test-client-id/campaigns/direct',
        {
          accounts: validAccounts,
          message,
          title
        }
      );
      
      expect(result).toEqual(mockResponse);
    });
    
    it('should throw an error if accounts array is empty', async () => {
      await expect(sms.send([], message, title))
        .rejects
        .toThrow('At least one account is required');
    });
    
    it('should throw an error if message is missing', async () => {
      await expect(sms.send(validAccounts, '', title))
        .rejects
        .toThrow('Message is required');
    });
    
    it('should throw an error if title is missing', async () => {
      await expect(sms.send(validAccounts, message, ''))
        .rejects
        .toThrow('Campaign title is required');
    });
    
    it('should validate account fields', async () => {
      const invalidAccounts = [
        { lastName: 'Doe', phone: '+15551234567' } // Missing firstName
      ];
      
      await expect(sms.send(invalidAccounts as any, message, title))
        .rejects
        .toThrow('First name is required for account at index 0');
    });
    
    it('should call progress callback if provided', async () => {
      const mockResponse = { id: '123', status: 'success' };
      mockRequest.mockResolvedValueOnce(mockResponse);
      
      const onProgress = jest.fn();
      const options: SMSOptions = { onProgress };
      
      await sms.send(validAccounts, message, title, options);
      
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, 'Preparing to send SMS');
      expect(onProgress).toHaveBeenNthCalledWith(2, 'Sending SMS');
      expect(onProgress).toHaveBeenNthCalledWith(3, 'SMS sent successfully');
    });
    
    it('should call progress callback on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('API Error'));
      
      const onProgress = jest.fn();
      const options: SMSOptions = { onProgress };
      
      await expect(sms.send(validAccounts, message, title, options))
        .rejects
        .toThrow('API Error');
      
      expect(onProgress).toHaveBeenCalledWith('SMS sending failed');
    });
  });
  
  describe('sendSingle', () => {
    it('should send a single SMS message', async () => {
      const mockResponse = { id: '123', status: 'success' };
      mockRequest.mockResolvedValueOnce(mockResponse);
      
      const result = await sms.sendSingle('John', 'Doe', '+15551234567', message, title);
      
      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/test-client-id/campaigns/direct',
        {
          accounts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              phone: '+15551234567'
            }
          ],
          message,
          title
        }
      );
      
      expect(result).toEqual(mockResponse);
    });
    
    it('should pass options to send method', async () => {
      // Create a spy on the send method
      const sendSpy = jest.spyOn(sms, 'send');
      
      const options: SMSOptions = {
        timeout: 5000,
        onProgress: jest.fn()
      };
      
      await sms.sendSingle('John', 'Doe', '+15551234567', message, title, options);
      
      expect(sendSpy).toHaveBeenCalledWith(
        [
          {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+15551234567'
          }
        ],
        message,
        title,
        options
      );
    });
  });
});
