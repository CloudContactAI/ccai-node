import { CCAI } from '../ccai';
import { Email } from '../email/email';

const mockRequest = jest.fn();
const mockCustomRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  getBaseUrl: () => 'https://core.cloudcontactai.com/api',
  getEmailBaseUrl: () => 'https://email-campaigns.cloudcontactai.com/api/v1',
  request: mockRequest,
  customRequest: mockCustomRequest,
} as unknown as CCAI;

const mockResponse = { id: 'email-1', campaignId: 'camp-1', status: 'sent' };
const validAccount = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+15551234567',
};

describe('Email Service', () => {
  let email: Email;

  beforeEach(() => {
    jest.clearAllMocks();
    email = new Email(mockCcai);
    mockCustomRequest.mockResolvedValue(mockResponse);
  });

  describe('send()', () => {
    it('should send email campaign to multiple recipients', async () => {
      const accounts = [
        validAccount,
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+15559876543' },
      ];
      const result = await email.send(
        accounts,
        'Test Subject',
        '<p>Hello!</p>',
        'sender@example.com',
        'reply@example.com',
        'Test Sender'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          subject: 'Test Subject',
          message: '<p>Hello!</p>',
          senderEmail: 'sender@example.com',
          accounts,
        }),
        expect.any(String),
        expect.objectContaining({ AccountId: 'client-123', ClientId: 'client-123' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if accounts array is empty', async () => {
      await expect(
        email.send([], 'Subject', '<p>Hi</p>', 'sender@test.com', 'reply@test.com', 'Sender')
      ).rejects.toThrow();
    });

    it('should throw if subject is missing', async () => {
      await expect(
        email.send([validAccount], '', '<p>Hi</p>', 'sender@test.com', 'reply@test.com', 'Sender')
      ).rejects.toThrow();
    });

    it('should throw if message is missing', async () => {
      await expect(
        email.send([validAccount], 'Subject', '', 'sender@test.com', 'reply@test.com', 'Sender')
      ).rejects.toThrow();
    });

    it('should throw if senderEmail is missing', async () => {
      await expect(
        email.send([validAccount], 'Subject', '<p>Hi</p>', '', 'reply@test.com', 'Sender')
      ).rejects.toThrow();
    });

    it('should throw if replyEmail is missing', async () => {
      await expect(
        email.send([validAccount], 'Subject', '<p>Hi</p>', 'sender@test.com', '', 'Sender')
      ).rejects.toThrow();
    });

    it('should send email with custom senderName', async () => {
      await email.send(
        [validAccount],
        'Subject',
        '<p>Hi</p>',
        'sender@test.com',
        'reply@test.com',
        'Custom Sender'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({ senderName: 'Custom Sender' }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('sendSingle()', () => {
    it('should send email to a single recipient', async () => {
      const result = await email.sendSingle(
        'John',
        'Doe',
        'john@example.com',
        'Welcome',
        '<p>Hello John!</p>',
        'noreply@company.com',
        'support@company.com',
        'Company',
        'Welcome Email'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          subject: 'Welcome',
          accounts: [expect.objectContaining({ email: 'john@example.com' })],
        }),
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if email is missing', async () => {
      await expect(
        email.sendSingle(
          'John',
          'Doe',
          '',
          'Subject',
          '<p>Hi</p>',
          'sender@test.com',
          'reply@test.com',
          'Sender',
          'Campaign'
        )
      ).rejects.toThrow();
    });

    it('should throw if firstName is missing', async () => {
      await expect(
        email.sendSingle(
          '',
          'Doe',
          'john@example.com',
          'Subject',
          '<p>Hi</p>',
          'sender@test.com',
          'reply@test.com',
          'Sender',
          'Campaign'
        )
      ).rejects.toThrow();
    });
  });

  describe('sendCampaign()', () => {
    it('should send a full campaign object', async () => {
      const campaign = {
        subject: 'Newsletter',
        title: 'Monthly Newsletter',
        message: '<p>Updates!</p>',
        senderEmail: 'news@company.com',
        replyEmail: 'support@company.com',
        senderName: 'Company News',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      const result = await email.sendCampaign(campaign);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({ subject: 'Newsletter' }),
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should send campaign with multiple senders', async () => {
      const campaign = {
        subject: 'Promotional Email',
        title: 'Promo Campaign',
        message: '<p>Special offer!</p>',
        senderEmail: 'promo@company.com',
        replyEmail: 'support@company.com',
        senderName: 'Promo Team',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [{ senderEmail: 'alt@company.com', senderName: 'Alternative' }],
      };

      const result = await email.sendCampaign(campaign);
      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          subject: 'Promotional Email',
          senders: expect.arrayContaining([
            expect.objectContaining({ senderEmail: 'alt@company.com' }),
          ]),
        }),
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call onProgress callback with campaign lifecycle events', async () => {
      const onProgress = jest.fn();
      const campaign = {
        subject: 'Test Campaign',
        title: 'Test',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: 'Sender',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await email.sendCampaign(campaign, { onProgress });

      expect(onProgress).toHaveBeenCalledWith('Preparing to send email campaign');
      expect(onProgress).toHaveBeenCalledWith('Sending email campaign');
      expect(onProgress).toHaveBeenCalledWith('Email campaign sent successfully');
    });

    it('should call onProgress with error message on failure', async () => {
      const onProgress = jest.fn();
      mockCustomRequest.mockRejectedValueOnce(new Error('Send failed'));

      const campaign = {
        subject: 'Test Campaign',
        title: 'Test',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: 'Sender',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await expect(email.sendCampaign(campaign, { onProgress })).rejects.toThrow();
      expect(onProgress).toHaveBeenCalledWith('Email campaign sending failed');
    });

    it('should validate account firstName, lastName, email in campaign', async () => {
      const campaign = {
        subject: 'Test',
        title: 'Test',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: 'Sender',
        accounts: [
          {
            firstName: '',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        ],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await expect(email.sendCampaign(campaign)).rejects.toThrow('First name is required');
    });

    it('should throw if campaign title is missing', async () => {
      const campaign = {
        subject: 'Test',
        title: '',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: 'Sender',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Campaign title is required');
    });

    it('should throw if campaign senderName is missing', async () => {
      const campaign = {
        subject: 'Test',
        title: 'Test',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: '',
        accounts: [validAccount],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Sender name is required');
    });

    it('should throw if account lastName is missing in campaign', async () => {
      const campaign = {
        subject: 'Test',
        title: 'Test',
        message: '<p>Test</p>',
        senderEmail: 'sender@test.com',
        replyEmail: 'reply@test.com',
        senderName: 'Sender',
        accounts: [
          {
            firstName: 'John',
            lastName: '',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        ],
        campaignType: 'EMAIL' as const,
        addToList: 'noList',
        contactInput: 'accounts',
        fromType: 'single',
        senders: [],
      };

      await expect(email.sendCampaign(campaign)).rejects.toThrow('Last name is required');
    });
  });

  describe('EmailAccount custom fields', () => {
    it('should send EmailAccount with customAccountId to API', async () => {
      const accountWithCustomId = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+15551234567',
        customAccountId: 'ext-id-12345',
      };

      await email.send(
        [accountWithCustomId],
        'Subject',
        '<p>Hi</p>',
        'sender@test.com',
        'reply@test.com',
        'Sender'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          accounts: [expect.objectContaining({ customAccountId: 'ext-id-12345' })],
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should send EmailAccount with data field to API', async () => {
      const accountWithData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+15551234567',
        data: { tier: 'gold', locale: 'en-US' },
      };

      await email.send(
        [accountWithData],
        'Subject',
        '<p>Hi</p>',
        'sender@test.com',
        'reply@test.com',
        'Sender'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          accounts: [expect.objectContaining({ data: { tier: 'gold', locale: 'en-US' } })],
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should map customData to messageData in email accounts (wire format)', async () => {
      const accountWithCustomData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '',
        customData: '{"source":"email-test"}',
      };

      await email.send(
        [accountWithCustomData],
        'Subject',
        '<p>Hi</p>',
        'sender@test.com',
        'reply@test.com',
        'Sender'
      );

      expect(mockCustomRequest).toHaveBeenCalledWith(
        'POST',
        '/campaigns',
        expect.objectContaining({
          accounts: [expect.objectContaining({ messageData: '{"source":"email-test"}' })],
        }),
        expect.any(String),
        expect.any(Object)
      );

      // customData must NOT appear in the wire payload
      const sentPayload = mockCustomRequest.mock.calls[0][2] as {
        accounts: Record<string, unknown>[];
      };
      expect(sentPayload.accounts[0]?.customData).toBeUndefined();
    });
  });

  describe('EmailResponse fields', () => {
    it('should return message and responseId from API response', async () => {
      mockCustomRequest.mockResolvedValueOnce({
        id: 'email-1',
        campaignId: 'camp-1',
        status: 'sent',
        message: 'Email campaign sent successfully',
        responseId: 'resp-id-xyz',
      });

      const result = await email.send(
        [validAccount],
        'Subject',
        '<p>Hi</p>',
        'sender@test.com',
        'reply@test.com',
        'Sender'
      );

      expect(result.message).toBe('Email campaign sent successfully');
      expect(result.responseId).toBe('resp-id-xyz');
    });
  });
});
