import axios from 'axios';
import { CCAI } from '../ccai';

jest.mock('axios');
// biome-ignore lint/suspicious/noExplicitAny: test mock requires any cast
const mockedAxios = axios as any;

describe('CCAI Client', () => {
  const validConfig = {
    clientId: 'test-client-123',
    apiKey: 'test-api-key-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      const ccai = new CCAI(validConfig);
      expect(ccai.getClientId()).toBe('test-client-123');
      expect(ccai.getApiKey()).toBe('test-api-key-456');
    });

    it('should use production URLs by default', () => {
      const ccai = new CCAI(validConfig);
      expect(ccai.getBaseUrl()).toContain('core.cloudcontactai.com');
      expect(ccai.getEmailBaseUrl()).toContain('email-campaigns.cloudcontactai.com');
    });

    it('should use test environment URLs when useTestEnvironment is true', () => {
      const ccai = new CCAI({ ...validConfig, useTestEnvironment: true });
      expect(ccai.getBaseUrl()).toContain('core-test-cloudcontactai.allcode.com');
      expect(ccai.getEmailBaseUrl()).toContain('email-campaigns-test-cloudcontactai.allcode.com');
    });

    it('should allow custom baseUrl override', () => {
      const ccai = new CCAI({ ...validConfig, baseUrl: 'https://custom.api.com' });
      expect(ccai.getBaseUrl()).toBe('https://custom.api.com');
    });

    it('should expose sms, mms, email, webhook, contact services', () => {
      const ccai = new CCAI(validConfig);
      expect(ccai.sms).toBeDefined();
      expect(ccai.mms).toBeDefined();
      expect(ccai.email).toBeDefined();
      expect(ccai.webhook).toBeDefined();
      expect(ccai.contact).toBeDefined();
    });

    it('should allow custom emailBaseUrl override', () => {
      const ccai = new CCAI({ ...validConfig, emailBaseUrl: 'https://custom-email.com' });
      expect(ccai.getEmailBaseUrl()).toBe('https://custom-email.com');
    });

    it('should allow custom filesBaseUrl override', () => {
      const ccai = new CCAI({ ...validConfig, filesBaseUrl: 'https://custom-files.com' });
      expect(ccai.getFilesBaseUrl()).toBe('https://custom-files.com');
    });

    it('should correctly report test environment status', () => {
      const ccaiProd = new CCAI(validConfig);
      const ccaiTest = new CCAI({ ...validConfig, useTestEnvironment: true });
      expect(ccaiProd.isTestEnvironment()).toBe(false);
      expect(ccaiTest.isTestEnvironment()).toBe(true);
    });
  });

  describe('request method', () => {
    it('should make a successful POST request', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { success: true, id: '123' },
      });

      const ccai = new CCAI(validConfig);
      const result = await ccai.request('POST', '/test', { test: 'data' });

      expect(result).toEqual({ success: true, id: '123' });
      expect(mockedAxios).toHaveBeenCalled();
    });

    it('should handle axios error with response', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'Bad request' } },
      });

      const ccai = new CCAI(validConfig);
      await expect(ccai.request('POST', '/test')).rejects.toThrow('API Error: 400');
    });

    it('should handle axios error with no response', async () => {
      mockedAxios.mockRejectedValueOnce({
        request: {},
        message: 'Network error',
      });

      const ccai = new CCAI(validConfig);
      await expect(ccai.request('POST', '/test')).rejects.toThrow('No response received from API');
    });

    it('should handle unknown errors', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Unknown error'));

      const ccai = new CCAI(validConfig);
      await expect(ccai.request('POST', '/test')).rejects.toThrow('Unknown error');
    });
  });

  describe('customRequest method', () => {
    it('should make a request to custom base URL with extra headers', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { result: 'ok' },
      });

      const ccai = new CCAI(validConfig);
      const result = await ccai.customRequest('GET', '/custom', undefined, 'https://custom.com', {
        'X-Custom-Header': 'value',
      });

      expect(result).toEqual({ result: 'ok' });
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://custom.com/custom',
          headers: expect.objectContaining({
            'X-Custom-Header': 'value',
          }),
        })
      );
    });

    it('should handle custom request errors with response', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: { status: 403, data: { error: 'Forbidden' } },
      });

      const ccai = new CCAI(validConfig);
      await expect(
        ccai.customRequest('POST', '/custom', { data: 'test' }, 'https://custom.com')
      ).rejects.toThrow('API Error: 403');
    });

    it('should handle custom request errors with no response', async () => {
      mockedAxios.mockRejectedValueOnce({
        request: {},
        message: 'Timeout',
      });

      const ccai = new CCAI(validConfig);
      await expect(ccai.customRequest('POST', '/custom')).rejects.toThrow(
        'No response received from API'
      );
    });
  });
});
