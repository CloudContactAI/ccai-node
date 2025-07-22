/**
 * Integration tests for the Email functionality
 * 
 * Note: These tests are meant to be run manually with valid credentials
 * and are skipped by default to avoid making actual API calls during automated testing.
 */

import { CCAI } from '../../ccai';
import { EmailCampaign } from '../../email/email';

// Skip these tests by default since they make actual API calls
describe.skip('Email Integration', () => {
  let ccai: CCAI;

  beforeAll(() => {
    // Replace with valid credentials for manual testing
    ccai = new CCAI({
      clientId: 'YOUR_CLIENT_ID',
      apiKey: 'YOUR_API_KEY'
    });
  });

  it('should send a single email', async () => {
    const result = await ccai.email.sendSingle(
      'Test',
      'User',
      'test@example.com', // Replace with a valid email for testing
      'Integration Test Email',
      '<p>This is an integration test email.</p><p>If you received this, the test was successful!</p>',
      'sender@example.com', // Replace with a valid sender email
      'reply@example.com', // Replace with a valid reply-to email
      'Test Sender',
      'Integration Test Campaign',
      {
        onProgress: (status) => console.log(`Status: ${status}`)
      }
    );

    console.log('Email send result:', result);
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  }, 30000); // Increase timeout for API call

  it('should send an email campaign to multiple recipients', async () => {
    const campaign: EmailCampaign = {
      subject: 'Multi-recipient Integration Test',
      title: 'Multi-recipient Integration Campaign',
      message: '<p>Hello ${firstName},</p><p>This is an integration test email for multiple recipients.</p><p>Thanks,<br>Test Sender</p>',
      senderEmail: 'sender@example.com', // Replace with a valid sender email
      replyEmail: 'reply@example.com', // Replace with a valid reply-to email
      senderName: 'Test Sender',
      accounts: [
        {
          firstName: 'Test1',
          lastName: 'User1',
          email: 'test1@example.com', // Replace with a valid email
          phone: ''
        },
        {
          firstName: 'Test2',
          lastName: 'User2',
          email: 'test2@example.com', // Replace with a valid email
          phone: ''
        }
      ],
      campaignType: 'EMAIL',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: []
    };

    const result = await ccai.email.sendCampaign(campaign, {
      onProgress: (status) => console.log(`Status: ${status}`)
    });

    console.log('Campaign send result:', result);
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.messagesSent).toBe(2);
  }, 30000); // Increase timeout for API call

  it('should handle a scheduled email campaign', async () => {
    // Schedule for 1 hour in the future
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 1);
    
    const campaign: EmailCampaign = {
      subject: 'Scheduled Email Test',
      title: 'Scheduled Email Campaign',
      message: '<p>Hello ${firstName},</p><p>This is a scheduled test email.</p><p>Thanks,<br>Test Sender</p>',
      senderEmail: 'sender@example.com', // Replace with a valid sender email
      replyEmail: 'reply@example.com', // Replace with a valid reply-to email
      senderName: 'Test Sender',
      accounts: [
        {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com', // Replace with a valid email
          phone: ''
        }
      ],
      campaignType: 'EMAIL',
      scheduledTimestamp: scheduledTime.toISOString(),
      scheduledTimezone: 'America/New_York',
      addToList: 'noList',
      contactInput: 'accounts',
      fromType: 'single',
      senders: []
    };

    const result = await ccai.email.sendCampaign(campaign);

    console.log('Scheduled campaign result:', result);
    expect(result).toBeDefined();
    // The status might be different for scheduled campaigns
    expect(result.id).toBeDefined();
  }, 30000); // Increase timeout for API call
});
