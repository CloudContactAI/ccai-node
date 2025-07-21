/**
 * Tests for the webhook functionality
 */

import { CCAI } from '../../ccai';
import { WebhookEventType } from '../../webhook/types';
import { createWebhookHandler } from '../../webhook/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

// Mock the CCAI client
jest.mock('../../ccai');

// Mock Next.js request and response
const mockRequest = () => {
  return {
    method: 'POST',
    body: {
      type: WebhookEventType.MESSAGE_SENT,
      campaign: {
        id: 123,
        title: 'Test Campaign',
        message: '',
        senderPhone: '+11234567890',
        createdAt: '2025-07-14 22:18:28.273',
        runAt: ''
      },
      from: '+11234567890',
      to: '+19876543210',
      message: 'Test message'
    },
    headers: {
      'x-ccai-signature': 'test-signature'
    }
  } as unknown as NextApiRequest;
};

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  } as unknown as NextApiResponse;
  return res;
};

describe('Webhook', () => {
  let ccai: CCAI;

  beforeEach(() => {
    ccai = new CCAI({
      clientId: 'test-client-id',
      apiKey: 'test-api-key'
    });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Webhook Handler', () => {
    it('should handle message sent events', async () => {
      const req = mockRequest();
      const res = mockResponse();
      
      const onMessageSent = jest.fn();
      const handler = createWebhookHandler({
        onMessageSent,
        logEvents: false
      });
      
      await handler(req, res);
      
      expect(onMessageSent).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
    
    it('should handle message received events', async () => {
      const req = mockRequest();
      req.body.type = WebhookEventType.MESSAGE_RECEIVED;
      const res = mockResponse();
      
      const onMessageReceived = jest.fn();
      const handler = createWebhookHandler({
        onMessageReceived,
        logEvents: false
      });
      
      await handler(req, res);
      
      expect(onMessageReceived).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
    
    it('should reject non-POST requests', async () => {
      const req = mockRequest();
      req.method = 'GET';
      const res = mockResponse();
      
      const handler = createWebhookHandler();
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
    
    it('should check for signature when secret is provided', async () => {
      const req = mockRequest();
      delete req.headers['x-ccai-signature'];
      const res = mockResponse();
      
      const handler = createWebhookHandler({
        secret: 'test-secret'
      });
      
      await handler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature header' });
    });
  });
});
