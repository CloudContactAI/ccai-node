/**
 * Tests for the CCAI class
 */

import axios from 'axios';
import { CCAI } from '../ccai';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CCAI', () => {
  let ccai: CCAI;

  beforeEach(() => {
    ccai = new CCAI({
      clientId: 'test-client-id',
      apiKey: 'test-api-key'
    });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw an error if clientId is missing', () => {
      expect(() => {
        new CCAI({
          clientId: '',
          apiKey: 'test-api-key'
        });
      }).toThrow('Client ID is required');
    });

    it('should throw an error if apiKey is missing', () => {
      expect(() => {
        new CCAI({
          clientId: 'test-client-id',
          apiKey: ''
        });
      }).toThrow('API Key is required');
    });

    it('should use default baseUrl if not provided', () => {
      const instance = new CCAI({
        clientId: 'test-client-id',
        apiKey: 'test-api-key'
      });
      
      expect(instance.getBaseUrl()).toBe('https://core.cloudcontactai.com/api');
    });

    it('should use custom baseUrl if provided', () => {
      const instance = new CCAI({
        clientId: 'test-client-id',
        apiKey: 'test-api-key',
        baseUrl: 'https://custom-api.example.com'
      });
      
      expect(instance.getBaseUrl()).toBe('https://custom-api.example.com');
    });

    it('should initialize all services', () => {
      const instance = new CCAI({
        clientId: 'test-client-id',
        apiKey: 'test-api-key'
      });
      
      expect(instance.sms).toBeDefined();
      expect(instance.mms).toBeDefined();
      expect(instance.email).toBeDefined();
      expect(instance.webhook).toBeDefined();
    });
  });

  describe('request', () => {
    it('should make a request to the default base URL', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: { success: true }
      });

      const result = await ccai.request('get', '/test-endpoint');

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'get',
        url: 'https://core.cloudcontactai.com/api/test-endpoint',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: undefined
      });

      // Verify result
      expect(result).toEqual({ success: true });
    });

    it('should handle request errors', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          status: 404,
          data: {
            error: 'Not Found',
            message: 'Resource not found'
          }
        }
      };
      mockedAxios.mockRejectedValueOnce(errorResponse);

      await expect(ccai.request('get', '/not-found')).rejects.toThrow(
        'API Error: 404 - {"error":"Not Found","message":"Resource not found"}'
      );
    });

    it('should handle network errors', async () => {
      // Mock network error
      const networkError = {
        request: {}
      };
      mockedAxios.mockRejectedValueOnce(networkError);

      await expect(ccai.request('get', '/network-error')).rejects.toThrow(
        'No response received from API'
      );
    });

    it('should handle other errors', async () => {
      // Mock other error
      mockedAxios.mockRejectedValueOnce(new Error('Unknown error'));

      await expect(ccai.request('get', '/other-error')).rejects.toThrow(
        'Unknown error'
      );
    });
  });

  describe('customRequest', () => {
    it('should make a request to the specified custom base URL', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: { success: true }
      });

      const customBaseUrl = 'https://email-campaigns.cloudcontactai.com/api/v1';
      const result = await ccai.customRequest('post', '/campaigns', { test: true }, customBaseUrl);

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://email-campaigns.cloudcontactai.com/api/v1/campaigns',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: { test: true }
      });

      // Verify result
      expect(result).toEqual({ success: true });
    });

    it('should fall back to default base URL if custom URL is not provided', async () => {
      // Mock successful response
      mockedAxios.mockResolvedValueOnce({
        data: { success: true }
      });

      const result = await ccai.customRequest('post', '/test-endpoint', { test: true });

      // Verify axios was called with correct parameters
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'post',
        url: 'https://core.cloudcontactai.com/api/test-endpoint',
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        data: { test: true }
      });

      // Verify result
      expect(result).toEqual({ success: true });
    });

    it('should handle request errors in customRequest', async () => {
      // Mock error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            error: 'Bad Request',
            message: 'Invalid data'
          }
        }
      };
      mockedAxios.mockRejectedValueOnce(errorResponse);

      const customBaseUrl = 'https://email-campaigns.cloudcontactai.com/api/v1';
      await expect(ccai.customRequest('post', '/campaigns', { test: true }, customBaseUrl)).rejects.toThrow(
        'API Error: 400 - {"error":"Bad Request","message":"Invalid data"}'
      );
    });
  });
});
