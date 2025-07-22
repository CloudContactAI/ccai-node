/**
 * Tests for the Email class
 */

import axios from 'axios';
import { CCAI } from '../../ccai';
import { Email, EmailCampaign, EmailOptions } from '../../email/email';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Email', () => {
  let ccai: CCAI;
  let email: Email;

  beforeEach(() => {
    ccai = new CCAI({
      clientId: 'test-client-id',
      apiKey: 'test-api-key'
    });
    email = ccai.email;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('sendCampaign', () => {
    it('should send an email campaign successfully', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'campaign-123',
          status: 'success',
          messagesSent: 1
        }
      });

      const campaign: EmailCampaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '' // Required by Account type but not used for email
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      };

      const result = await email.sendCampaign(campaign);

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://email-campaigns.cloudcontactai.com/api/v1/campaigns',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: campaign
      });

      // Verify result
      expect(result).toEqual({
        id: 'campaign-123',
        status: 'success',
        messagesSent: 1
      });
    });

    it('should send an email campaign to multiple recipients', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'campaign-456',
          status: 'success',
          messagesSent: 3
        }
      });

      const campaign: EmailCampaign = {
        subject: 'Multi-recipient Test',
        title: 'Multi-recipient Campaign',
        message: '<p>Hello ${firstName}, this is a test.</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: ''
          },
          {
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'bob@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      };

      const result = await email.sendCampaign(campaign);

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://email-campaigns.cloudcontactai.com/api/v1/campaigns',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: campaign
      });

      // Verify result
      expect(result).toEqual({
        id: 'campaign-456',
        status: 'success',
        messagesSent: 3
      });
    });

    it('should handle campaign options correctly', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'campaign-789',
          status: 'success',
          messagesSent: 1
        }
      });

      const campaign: EmailCampaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
        scheduledTimestamp: '2025-08-01T12:00:00Z',
        scheduledTimezone: 'America/New_York'
      };

      const options: EmailOptions = {
        timeout: 5000,
        retries: 3,
        onProgress: jest.fn()
      };

      const result = await email.sendCampaign(campaign, options);

      // Verify onProgress callback was called
      expect(options.onProgress).toHaveBeenCalledWith('Preparing to send email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Sending email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Email campaign sent successfully');

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://email-campaigns.cloudcontactai.com/api/v1/campaigns',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: campaign
      });

      // Verify result
      expect(result).toEqual({
        id: 'campaign-789',
        status: 'success',
        messagesSent: 1
      });
    });

    it('should handle API errors correctly', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            error: 'Bad Request',
            message: 'Invalid email format'
          }
        }
      };
      mockedAxios.mockRejectedValueOnce(errorResponse);

      const campaign: EmailCampaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'invalid-email',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      };

      const options: EmailOptions = {
        onProgress: jest.fn()
      };

      await expect(email.sendCampaign(campaign, options)).rejects.toThrow(
        'API Error: 400 - {"error":"Bad Request","message":"Invalid email format"}'
      );

      // Verify onProgress callback was called with failure
      expect(options.onProgress).toHaveBeenCalledWith('Preparing to send email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Sending email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Email campaign sending failed');
    });

    it('should throw an error if accounts are missing', async () => {
      const campaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      } as EmailCampaign;

      await expect(email.sendCampaign(campaign)).rejects.toThrow('At least one account is required');
    });

    it('should throw an error if subject is missing', async () => {
      const campaign = {
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      } as EmailCampaign;

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Subject is required');
    });

    it('should throw an error if title is missing', async () => {
      const campaign = {
        subject: 'Test Subject',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      } as EmailCampaign;

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Campaign title is required');
    });

    it('should throw an error if message is missing', async () => {
      const campaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      } as EmailCampaign;

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Message content is required');
    });

    it('should throw an error if sender email is missing', async () => {
      const campaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      } as EmailCampaign;

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Sender email is required');
    });

    it('should throw an error if account is missing required fields', async () => {
      const campaign: EmailCampaign = {
        subject: 'Test Subject',
        title: 'Test Campaign',
        message: '<p>Test message</p>',
        senderEmail: 'sender@example.com',
        replyEmail: 'reply@example.com',
        senderName: 'Test Sender',
        accounts: [
          {
            firstName: '',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: ''
          }
        ],
        campaignType: 'EMAIL',
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: []
      };

      await expect(email.sendCampaign(campaign)).rejects.toThrow('First name is required for account at index 0');
    });
  });

  describe('sendSingle', () => {
    it('should send a single email successfully', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'campaign-123',
          status: 'success',
          messagesSent: 1
        }
      });

      const result = await email.sendSingle(
        'John',
        'Doe',
        'john@example.com',
        'Test Subject',
        '<p>Test message</p>',
        'sender@example.com',
        'reply@example.com',
        'Test Sender',
        'Test Campaign'
      );

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://email-campaigns.cloudcontactai.com/api/v1/campaigns',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: {
          subject: 'Test Subject',
          title: 'Test Campaign',
          message: '<p>Test message</p>',
          senderEmail: 'sender@example.com',
          replyEmail: 'reply@example.com',
          senderName: 'Test Sender',
          accounts: [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: ''
            }
          ],
          campaignType: 'EMAIL',
          addToList: 'noList',
          contactInput: 'accounts',
          fromType: 'single',
          senders: []
        }
      });

      // Verify result
      expect(result).toEqual({
        id: 'campaign-123',
        status: 'success',
        messagesSent: 1
      });
    });

    it('should send a single email with options', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'campaign-123',
          status: 'success',
          messagesSent: 1
        }
      });

      const options: EmailOptions = {
        timeout: 5000,
        retries: 3,
        onProgress: jest.fn()
      };

      const result = await email.sendSingle(
        'John',
        'Doe',
        'john@example.com',
        'Test Subject',
        '<p>Test message</p>',
        'sender@example.com',
        'reply@example.com',
        'Test Sender',
        'Test Campaign',
        options
      );

      // Verify onProgress callback was called
      expect(options.onProgress).toHaveBeenCalledWith('Preparing to send email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Sending email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Email campaign sent successfully');

      // Verify result
      expect(result).toEqual({
        id: 'campaign-123',
        status: 'success',
        messagesSent: 1
      });
    });

    it('should handle API errors when sending a single email', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: 'Unauthorized',
            message: 'Invalid API key'
          }
        }
      };
      mockedAxios.mockRejectedValueOnce(errorResponse);

      const options: EmailOptions = {
        onProgress: jest.fn()
      };

      await expect(email.sendSingle(
        'John',
        'Doe',
        'john@example.com',
        'Test Subject',
        '<p>Test message</p>',
        'sender@example.com',
        'reply@example.com',
        'Test Sender',
        'Test Campaign',
        options
      )).rejects.toThrow('API Error: 401 - {"error":"Unauthorized","message":"Invalid API key"}');

      // Verify onProgress callback was called with failure
      expect(options.onProgress).toHaveBeenCalledWith('Preparing to send email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Sending email campaign');
      expect(options.onProgress).toHaveBeenCalledWith('Email campaign sending failed');
    });
  });
});
