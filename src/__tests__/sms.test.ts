import { CCAI } from '../ccai';
import { SMS } from '../sms/sms';

const mockRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  getBaseUrl: () => 'https://core.cloudcontactai.com/api',
  request: mockRequest,
} as unknown as CCAI;

const validAccount = { firstName: 'John', lastName: 'Doe', phone: '+15551234567' };
const mockResponse = { id: 'resp-1', campaignId: 'camp-1', status: 'sent' };

describe('SMS Service', () => {
  let sms: SMS;

  beforeEach(() => {
    jest.clearAllMocks();
    sms = new SMS(mockCcai);
    mockRequest.mockResolvedValue(mockResponse);
  });

  describe('send()', () => {
    it('should send SMS to multiple recipients', async () => {
      const accounts = [
        validAccount,
        { firstName: 'Jane', lastName: 'Smith', phone: '+15559876543' },
      ];
      const result = await sms.send(accounts, 'Hello ${firstName}!', 'Test Campaign');

      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/client-123/campaigns/direct',
        expect.objectContaining({
          accounts,
          message: 'Hello ${firstName}!',
          title: 'Test Campaign',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw if accounts array is empty', async () => {
      await expect(sms.send([], 'Hello', 'Test')).rejects.toThrow();
    });

    it('should throw if message is missing', async () => {
      await expect(sms.send([validAccount], '', 'Test')).rejects.toThrow();
    });

    it('should throw if title is missing', async () => {
      await expect(sms.send([validAccount], 'Hello', '')).rejects.toThrow();
    });

    it('should throw if account is missing firstName', async () => {
      const bad = { firstName: '', lastName: 'Doe', phone: '+15551234567' };
      await expect(sms.send([bad], 'Hello', 'Test')).rejects.toThrow();
    });

    it('should throw if account is missing lastName', async () => {
      const bad = { firstName: 'John', lastName: '', phone: '+15551234567' };
      await expect(sms.send([bad], 'Hello', 'Test')).rejects.toThrow();
    });

    it('should throw if account is missing phone', async () => {
      const bad = { firstName: 'John', lastName: 'Doe', phone: '' };
      await expect(sms.send([bad], 'Hello', 'Test')).rejects.toThrow();
    });

    it('should call onProgress callback when provided', async () => {
      const onProgress = jest.fn();
      await sms.send([validAccount], 'Hello', 'Test', undefined, { onProgress });
      expect(onProgress).toHaveBeenCalledWith('Preparing to send SMS');
      expect(onProgress).toHaveBeenCalledWith('Sending SMS');
      expect(onProgress).toHaveBeenCalledWith('SMS sent successfully');
    });

    it('should call onProgress with error message on failure', async () => {
      const onProgress = jest.fn();
      mockRequest.mockRejectedValueOnce(new Error('Send failed'));

      await expect(
        sms.send([validAccount], 'Hello', 'Test', undefined, { onProgress })
      ).rejects.toThrow('Send failed');
      expect(onProgress).toHaveBeenCalledWith('SMS sending failed');
    });

    it('should send data field in request (API wire format for variable substitution)', async () => {
      // Base variables always available: ${firstName}, ${lastName}, ${phone}, ${email}
      // data extends these with any additional key-value pairs the client defines
      // CloudContact substitutes them in the message: "Hello ${firstName} from ${city}!"
      const account = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        data: { city: 'Miami', country: 'USA', plan: 'premium' },
      };
      await sms.send([account], 'Hello ${firstName} from ${city}, ${country}!', 'Test');

      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/client-123/campaigns/direct',
        expect.objectContaining({
          accounts: [
            expect.objectContaining({
              data: { city: 'Miami', country: 'USA', plan: 'premium' },
            }),
          ],
        })
      );
    });

    it('should send customData as messageData in request (API wire format)', async () => {
      // customData is NOT used in the message — CloudContact forwards it as-is
      // in the webhook payload so the client can process it on their end.
      // The SDK maps customData → messageData before sending (Java @JsonProperty("messageData")).
      const account = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        customData: '{"orderId":"ORD-123","source":"checkout"}',
      };
      await sms.send([account], 'Your order ${orderId} is ready!', 'Test');

      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/client-123/campaigns/direct',
        expect.objectContaining({
          accounts: [
            expect.objectContaining({
              messageData: '{"orderId":"ORD-123","source":"checkout"}',
            }),
          ],
        })
      );
    });
  });

  describe('SMSResponse fields', () => {
    it('should return message and responseId from API response', async () => {
      mockRequest.mockResolvedValueOnce({
        id: 'resp-1',
        campaignId: 'camp-1',
        status: 'sent',
        message: 'SMS sent successfully',
        responseId: 'resp-id-abc',
      });

      const result = await sms.send([validAccount], 'Hello', 'Test');

      expect(result.message).toBe('SMS sent successfully');
      expect(result.responseId).toBe('resp-id-abc');
    });
  });

  describe('sendSingle()', () => {
    it('should send SMS to a single recipient', async () => {
      const result = await sms.sendSingle('John', 'Doe', '+15551234567', 'Hello!', 'Test');

      expect(mockRequest).toHaveBeenCalledWith(
        'post',
        '/clients/client-123/campaigns/direct',
        expect.objectContaining({
          accounts: [{ firstName: 'John', lastName: 'Doe', phone: '+15551234567' }],
          message: 'Hello!',
          title: 'Test',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw if phone is empty', async () => {
      await expect(sms.sendSingle('John', 'Doe', '', 'Hello', 'Test')).rejects.toThrow();
    });
  });
});
