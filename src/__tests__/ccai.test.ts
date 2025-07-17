/**
 * Tests for the CCAI class
 * 
 * @license MIT
 * @copyright 2025 CloudContactAI LLC
 */

import axios from 'axios';
import { CCAI, CCAIConfig } from '../ccai';
import { SMS } from '../sms/sms';
import { MMS } from '../sms/mms';

// Mock axios
jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('CCAI', () => {
  // Default config for tests
  const defaultConfig: CCAIConfig = {
    clientId: 'test-client-id',
    apiKey: 'test-api-key',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a new CCAI instance with default baseUrl', () => {
      const ccai = new CCAI(defaultConfig);
      expect(ccai).toBeInstanceOf(CCAI);
      expect(ccai.getClientId()).toBe(defaultConfig.clientId);
      expect(ccai.getApiKey()).toBe(defaultConfig.apiKey);
      expect(ccai.getBaseUrl()).toBe('https://core.cloudcontactai.com/api');
    });

    it('should create a new CCAI instance with custom baseUrl', () => {
      const customConfig = { ...defaultConfig, baseUrl: 'https://custom-api.example.com' };
      const ccai = new CCAI(customConfig);
      expect(ccai.getBaseUrl()).toBe(customConfig.baseUrl);
    });

    it('should throw an error if clientId is missing', () => {
      expect(() => new CCAI({ apiKey: 'test-api-key' } as CCAIConfig)).toThrow('Client ID is required');
    });

    it('should throw an error if apiKey is missing', () => {
      expect(() => new CCAI({ clientId: 'test-client-id' } as CCAIConfig)).toThrow('API Key is required');
    });
    
    it('should initialize the SMS service', () => {
      const ccai = new CCAI(defaultConfig);
      expect(ccai.sms).toBeInstanceOf(SMS);
    });
    
    it('should initialize the MMS service', () => {
      const ccai = new CCAI(defaultConfig);
      expect(ccai.mms).toBeInstanceOf(MMS);
    });
  });

  describe('request', () => {
    it('should make a successful API request', async () => {
      const ccai = new CCAI(defaultConfig);
      const mockResponse = { data: { id: '123', status: 'success' } };
      
      mockedAxios.mockResolvedValueOnce(mockResponse);
      
      const result = await ccai.request('get', '/test-endpoint');
      
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
      
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API error responses', async () => {
      const ccai = new CCAI(defaultConfig);
      const errorResponse = {
        response: {
          status: 400,
          data: { error: 'Bad Request' }
        }
      };
      
      mockedAxios.mockRejectedValueOnce(errorResponse);
      
      await expect(ccai.request('post', '/test-endpoint', { test: 'data' }))
        .rejects
        .toThrow(`API Error: 400 - {"error":"Bad Request"}`);
    });

    it('should handle network errors', async () => {
      const ccai = new CCAI(defaultConfig);
      const networkError = {
        request: {},
        message: 'Network Error'
      };
      
      mockedAxios.mockRejectedValueOnce(networkError);
      
      await expect(ccai.request('get', '/test-endpoint'))
        .rejects
        .toThrow('No response received from API');
    });

    it('should handle other errors', async () => {
      const ccai = new CCAI(defaultConfig);
      const otherError = new Error('Unknown error');
      
      mockedAxios.mockRejectedValueOnce(otherError);
      
      await expect(ccai.request('get', '/test-endpoint'))
        .rejects
        .toThrow('Unknown error');
    });
  });
});
