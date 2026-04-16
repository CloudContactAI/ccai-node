import * as crypto from 'crypto';
import { CCAI } from '../ccai';
import { Webhook } from '../webhook/webhook';

const mockRequest = jest.fn();

const mockCcai = {
  getClientId: () => 'client-123',
  getApiKey: () => 'api-key-456',
  request: mockRequest,
} as unknown as CCAI;

describe('Webhook Service', () => {
  let webhook: Webhook;

  beforeEach(() => {
    jest.clearAllMocks();
    webhook = new Webhook(mockCcai);
  });

  describe('register()', () => {
    it('should register a webhook without secret - server generates it', async () => {
      const responseItem = {
        id: '147',
        url: 'https://example.com/hook',
        method: 'POST',
        integrationType: 'ALL',
        secretKey: 'test-secret-key-12345',
      };
      mockRequest.mockResolvedValue([responseItem]);

      const result = await webhook.register({ url: 'https://example.com/hook' });

      // Verify secretKey was NOT sent to server (allowing server to generate)
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([
          expect.objectContaining({
            url: 'https://example.com/hook',
            method: 'POST',
            integrationType: 'ALL',
          }),
        ])
      );
      const payload = mockRequest.mock.calls[0]?.[2] as Array<Record<string, unknown>> | undefined;
      expect(payload?.[0]?.secretKey).toBeUndefined();

      // Verify the auto-generated secret is returned
      expect(result.secretKey).toBe('test-secret-key-12345');
    });

    it('should register a webhook with custom secret', async () => {
      const customSecret = 'my-custom-secret-key';
      const responseItem = {
        id: '148',
        url: 'https://example.com/hook',
        method: 'POST',
        integrationType: 'ALL',
        secretKey: customSecret,
      };
      mockRequest.mockResolvedValue([responseItem]);

      const result = await webhook.register({
        url: 'https://example.com/hook',
        secret: customSecret,
      });

      // Verify custom secret WAS sent to server
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([
          expect.objectContaining({
            url: 'https://example.com/hook',
            secretKey: customSecret,
          }),
        ])
      );

      // Verify the custom secret is returned
      expect(result.secretKey).toBe(customSecret);
    });

    it('should register a webhook with secretKey field', async () => {
      const customSecret = 'test-secret-key-67890';
      const responseItem = {
        id: '149',
        url: 'https://example.com/hook',
        method: 'POST',
        integrationType: 'ALL',
        secretKey: customSecret,
      };
      mockRequest.mockResolvedValue([responseItem]);

      const result = await webhook.register({
        url: 'https://example.com/hook',
        secretKey: customSecret,
      });

      // Verify secretKey field is used
      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([
          expect.objectContaining({
            url: 'https://example.com/hook',
            secretKey: customSecret,
          }),
        ])
      );
      expect(result.secretKey).toBe(customSecret);
    });

    it('should default integrationType to ALL', async () => {
      mockRequest.mockResolvedValue([
        { id: '1', url: 'https://test.com', method: 'POST', integrationType: 'ALL' },
      ]);
      await webhook.register({ url: 'https://test.com' });

      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([
          expect.objectContaining({
            integrationType: 'ALL',
          }),
        ])
      );
    });

    it('should handle non-array response from API', async () => {
      const nonArrayResponse = {
        id: '999',
        url: 'https://example.com/hook',
        method: 'POST',
        integrationType: 'SMS',
        secretKey: 'sk_test_123',
      };
      mockRequest.mockResolvedValue(nonArrayResponse);

      const result = await webhook.register({ url: 'https://example.com/hook' });

      expect(result).toEqual(nonArrayResponse);
      expect(result.id).toBe('999');
    });
  });

  describe('update()', () => {
    it('should update webhook using POST with id in array payload', async () => {
      const responseItem = {
        id: '42',
        url: 'https://new.com/hook',
        method: 'POST',
        integrationType: 'ALL',
      };
      mockRequest.mockResolvedValue([responseItem]);

      const result = await webhook.update('42', { url: 'https://new.com/hook' });

      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([expect.objectContaining({ id: 42, url: 'https://new.com/hook' })])
      );
      expect(result).toEqual(responseItem);
    });

    it('should include secretKey when updating with custom secret', async () => {
      const responseItem = {
        id: '42',
        url: 'https://new.com/hook',
        method: 'POST',
        integrationType: 'ALL',
        secretKey: 'custom-secret-123',
      };
      mockRequest.mockResolvedValue([responseItem]);

      await webhook.update('42', { url: 'https://new.com/hook', secret: 'custom-secret-123' });

      expect(mockRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/client/client-123/integration',
        expect.arrayContaining([
          expect.objectContaining({
            id: 42,
            url: 'https://new.com/hook',
            secretKey: 'custom-secret-123',
          }),
        ])
      );
    });

    it('should handle non-array response from API in update', async () => {
      const nonArrayResponse = {
        id: '42',
        url: 'https://new.com/hook',
        method: 'POST',
        integrationType: 'ALL',
      };
      mockRequest.mockResolvedValue(nonArrayResponse);

      const result = await webhook.update('42', { url: 'https://new.com/hook' });

      expect(result).toEqual(nonArrayResponse);
    });
  });

  describe('list()', () => {
    it('should list all webhooks via GET', async () => {
      const webhooks = [
        { id: '1', url: 'https://a.com', method: 'POST', integrationType: 'ALL' },
        { id: '2', url: 'https://b.com', method: 'POST', integrationType: 'SMS' },
      ];
      mockRequest.mockResolvedValue(webhooks);

      const result = await webhook.list();

      expect(mockRequest).toHaveBeenCalledWith('GET', '/v1/client/client-123/integration');
      expect(result).toEqual(webhooks);
    });
  });

  describe('delete()', () => {
    it('should delete a webhook by id via DELETE', async () => {
      mockRequest.mockResolvedValue({ success: true, message: 'deleted' });

      const result = await webhook.delete('42');

      expect(mockRequest).toHaveBeenCalledWith('DELETE', '/v1/client/client-123/integration/42');
      expect(result).toEqual({ success: true, message: 'deleted' });
    });
  });

  describe('verifySignature()', () => {
    const clientId = 'client-123';
    const eventHash = 'event-hash-abc123';
    const secret = 'test-webhook-secret';

    function computeHmac(clientId: string | number, eventHash: string, key: string): string {
      const data = `${clientId}:${eventHash}`;
      return crypto.createHmac('sha256', key).update(data).digest('base64');
    }

    it('should return true for a valid signature', () => {
      const validSig = computeHmac(clientId, eventHash, secret);
      expect(webhook.verifySignature(validSig, clientId, eventHash, secret)).toBe(true);
    });

    it('should return false for an invalid signature', () => {
      expect(webhook.verifySignature('invalidsig', clientId, eventHash, secret)).toBe(false);
    });

    it('should return false when signature is empty', () => {
      expect(webhook.verifySignature('', clientId, eventHash, secret)).toBe(false);
    });

    it('should return false when clientId is missing', () => {
      const validSig = computeHmac(clientId, eventHash, secret);
      expect(webhook.verifySignature(validSig, '', eventHash, secret)).toBe(false);
    });

    it('should return false when eventHash is missing', () => {
      const validSig = computeHmac(clientId, eventHash, secret);
      expect(webhook.verifySignature(validSig, clientId, '', secret)).toBe(false);
    });

    it('should return false when secret is empty', () => {
      const validSig = computeHmac(clientId, eventHash, secret);
      expect(webhook.verifySignature(validSig, clientId, eventHash, '')).toBe(false);
    });
  });

  describe('parseEvent()', () => {
    it('should parse a valid webhook event JSON', () => {
      const payload = JSON.stringify({
        eventType: 'message.sent',
        eventHash: 'hash-abc123',
        data: {
          To: '+15551234567',
          Message: 'Hello',
        },
      });

      const event = webhook.parseEvent(payload);
      expect(event).toBeDefined();
      expect(event.data.To).toBe('+15551234567');
    });

    it('should throw on invalid JSON', () => {
      expect(() => webhook.parseEvent('not-json')).toThrow();
    });
  });
});
